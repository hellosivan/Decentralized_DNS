import hashlib
import json
import os
import requests
from time import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from uuid import uuid4
from argparse import ArgumentParser
from flask import Flask, jsonify, request


class Blockchain:
    def __init__(self):
        self.current_domains = []
        self.current_trans_domains = []
        self.chain = []
        self.length = 0
        self.nodes = set()

        self.chain_file = 'data.json'
        self.temp_file = 'temp.json'
        self.transTemp_file = 'transTemp.json'
        self.node_file = 'nodeNet.json'

        try:
            with open(filepath + self.chain_file, 'r') as f:
                data = json.load(f)
                self.chain = data['chain']
                self.length = data['length']
        except:
            self.new_block(previous_hash='1', proof=100, miner=node_identifier)

        try:
            with open(filepath + self.temp_file, 'r') as f:
                data = json.load(f)
                self.current_domains = data['temp']
        except:
            pass

        try:
            with open(filepath + self.transTemp_file, 'r') as f:
                data = json.load(f)
                self.current_trans_domains = data['transTemp']
        except:
            pass

        try:
            with open(filepath + self.node_file, 'r') as f:
                data = json.load(f)
                self.nodes = set(data['net'])
        except:
            pass

    def register_node(self, address: str) -> None:
        """
        注册添加一个节点
        :param address: Address of node.
        """

        parsed_url = urlparse(address)
        self.nodes.add(parsed_url.netloc)
        f = open(filepath + self.node_file, 'w')
        f.write(json.dumps({
            'nodes': list(self.nodes)
        }))
        f.close()

    def valid_chain(self, chain: List[Dict[str, Any]]) -> bool:
        """
        验证区块链
        :param chain: A blockchain
        :return: True if valid, False if not
        """

        last_block = chain[0]
        current_index = 1

        while current_index < len(chain):
            block = chain[current_index]

            if block['previous_hash'] != self.hash(last_block):
                return False

            if not self.valid_proof(last_block['proof'], block['proof']):
                return False

            last_block = block
            current_index += 1

        return True

    def resolve_conflicts(self) -> bool:
        """
        共识算法解决冲突
        :return:  如果链被取代返回 True, 否则 False
        """

        neighbours = self.nodes
        new_chain = None

        max_length = self.length

        for node in neighbours:
            try:
                response = requests.get(f'http://{node}/chain')

                if response.status_code == 200:
                    length = response.json()['length']
                    chain = response.json()['chain']

                    if length > max_length and self.valid_chain(chain):
                        max_length = length
                        new_chain = chain
            except:
                continue

        if new_chain:
            self.chain = new_chain
            self.length = max_length
            f = open(filepath + self.chain_file, 'w')
            f.write(json.dumps({
                'chain': self.chain,
                'length': self.length,
            }))
            f.close()
            return True

        return False


    def new_block(self, proof: int, previous_hash: Optional[str], miner) -> Dict[str, Any]:
        """
        生成新块
        :param proof: 计算得到的随机数
        :param previous_hash: 前一个区块的hash值
        :return: 新区块
        """

        domains = []
        for current in self.current_domains:
            if not current['validFlag']:
                domains.append(current)
            if current['validFlag'] and len(current['confirm']) >= 1:
                domains.append(current)
        for domain in domains:
            self.current_domains.remove(domain)

        trans_domains = []
        for current_trans in self.current_trans_domains:
            if current_trans['validFlag'] and (current_trans['ownerAddr'] in current_trans['confirm']):
                trans_domains.append(current_trans)
        for domain in trans_domains:
            self.current_trans_domains.remove(domain)

        block = {
            'index': len(self.chain) + 1,
            'timestamp': int(round(time() * 1000)),
            'domains': domains+trans_domains,
            'proof': proof,
            'previous_hash': previous_hash or self.hash(self.chain[-1]),
            'miner': miner,
        }

        self.chain.append(block)
        self.length += 1

        f = open(filepath + self.temp_file, 'w')
        f.write(json.dumps({
            'temp': self.current_domains
        }))
        f.close()
        f = open(filepath + self.transTemp_file, 'w')
        f.write(json.dumps({
            'transTemp': self.current_trans_domains
        }))
        f.close()

        f = open(filepath + self.chain_file, 'w')
        f.write(json.dumps({
            'chain': self.chain,
            'length': self.length,
        }))
        f.close()

        return block

    def new_transaction(self, domainName: str, ipv4: str, ipv6: str, validFlag: bool, ownerAddr: str, timestamp,
                        transFlag = 0, transIpv4 = "", transIpv6 = "", transAddr = "", transTimestamp = None) -> int:
        """
        生成新交易信息，信息将加入到下一个待挖的区块中
        :param ipv4: 域名当前Ipv4
        :param ipv6: 域名当前Ipv6
        :param validFlag: 域名是否有效
        :param ownerAddr: 所属节点地址
        :param timestamp: 所属时间
        :param transFlag: 域名申请转移次数
        :param transIpv4: 转移的新IPv4
        :param transIpv6: 转移的新IPv6
        :param transAddr: 申请转移的节点地址
        :param transTimestamp: 申请转移时间
        :return: 待挖区块的index值
        """
        self.current_domains.append({
            'domainName': domainName,
            'ipv4': ipv4,
            'ipv6': ipv6,
            'validFlag': validFlag,
            'ownerAddr': ownerAddr,
            'timestamp': timestamp,
            'transFlag': transFlag,
            'transIpv4': transIpv4,
            'transIpv6': transIpv6,
            'transAddr': transAddr,
            'transTimestamp': transTimestamp,
            'confirm': []
        })

        f = open(filepath + self.temp_file, 'w')
        f.write(json.dumps({
            'temp': self.current_domains
        }))
        f.close()

        return self.last_block['index'] + 1


    def new_trans_transaction(self, domainName: str, ipv4: str, ipv6: str, validFlag: bool, ownerAddr: str, timestamp,
                        transFlag = 0, transIpv4 = "", transIpv6 = "", transAddr = "", transTimestamp = None) -> int:
        """
        生成转移新交易信息，信息将加入到下一个待挖的区块中
        :param ipv4: 域名当前Ipv4
        :param ipv6: 域名当前Ipv6
        :param validFlag: 域名是否有效
        :param ownerAddr: 所属节点地址
        :param timestamp: 所属时间
        :param transFlag: 域名申请转移次数
        :param transIpv4: 转移的新IPv4
        :param transIpv6: 转移的新IPv6
        :param transAddr: 申请转移的节点地址
        :param transTimestamp: 申请转移时间
        :return: 待挖区块的index值
        """
        self.current_trans_domains.append({
            'domainName': domainName,
            'ipv4': ipv4,
            'ipv6': ipv6,
            'validFlag': validFlag,
            'ownerAddr': ownerAddr,
            'timestamp': timestamp,
            'transFlag': transFlag,
            'transIpv4': transIpv4,
            'transIpv6': transIpv6,
            'transAddr': transAddr,
            'transTimestamp': transTimestamp,
            'confirm': []
        })

        f = open(filepath + self.transTemp_file, 'w')
        f.write(json.dumps({
            'transTemp': self.current_trans_domains
        }))
        f.close()

        return self.last_block['index'] + 1

    @property
    def last_block(self) -> Dict[str, Any]:
        return self.chain[-1]

    @staticmethod
    def hash(block: Dict[str, Any]) -> str:
        """
        生成区块的 SHA-256 hash值
        :param block
        """

        block_string = json.dumps(block, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def proof_of_work(self, last_proof: int) -> int:
        proof = 0
        while self.valid_proof(last_proof, proof) is False:
            proof += 1

        return proof

    @staticmethod
    def valid_proof(last_proof: int, proof: int) -> bool:
        """
        验证证明
        :param last_proof: Previous Proof
        :param proof: Current Proof
        :return: True if correct, False if not.
        """

        guess = f'{last_proof}{proof}'.encode()
        guess_hash = hashlib.sha256(guess).hexdigest()
        return guess_hash[:4] == "0000"


app = Flask(__name__)

filepath = './data/'
info_file = 'info.json'
nodeNet_file = 'nodeNet.json'

if not os.path.exists(filepath):
    os.makedirs(filepath)

try:
    with open(filepath + info_file, 'r') as file:
        node_identifier = json.load(file)['nodeAddr']
except:
    node_identifier = str(uuid4()).replace('-', '')

    file = open(filepath + info_file, 'w')
    file.write(json.dumps({
        'nodeAddr': node_identifier
    }))
    file.close()


blockchain = Blockchain()

@app.route('/mine', methods=['GET'])
def mine():
    blockchain.resolve_conflicts()

    last_block = blockchain.last_block
    last_proof = last_block['proof']
    proof = blockchain.proof_of_work(last_proof)

    with open(filepath + info_file, 'r') as f:
        miner = json.load(f)['miner']
        contribution = json.load(f)['contribution']
        credit = json.load(f)['credit']

    i = 0
    fValue = []
    while(i<len(contribution)):
        fValue.append(contribution[i]/100 + (credit[i]-60)/10)
        i = i+1
    j = 0
    num = 0
    maxvalue=fValue[0]
    while(j<len(contribution)):
        if maxvalue<fValue[j]:
            maxvalue=fValue[j]
            num = j
        j=j+1
    maxminer = miner[num]

    k= 0
    while( k < len(contribution) ):
        contribution[k] = contribution[k]+10
        credit[k] = credit[k]+0.1
        k = k+1
    contribution[num]=contribution[num]//2

    f = open(filepath + info_file, 'w')
    f.write(json.dumps({
        'miner': miner,
        'contribution': contribution,
        'credit': credit
    }))
    f.close()

    block = blockchain.new_block(proof, None, maxminer)

    response = {
        'message': "New Block Forged",
        'index': block['index'],
        'domains': block['domains'],
        'proof': block['proof'],
        'previous_hash': block['previous_hash'],
        'timestamp': block['timestamp'],
        'miner': block['miner'],
    }

    with open(filepath + nodeNet_file, 'r') as f:
        nodeNet = json.load(f)['nodeNet']
    for node in nodeNet:
        try:
            net = node['net']
            requests.get(f'http://{net}/broadcast/mineOk')
        except:
            continue

    return jsonify(response), 200


def remove_invalid_trans_domain(transDomains: List[Dict[str, Any]], domain: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    移除转移域名列表中的失效域名数据
    :param transDomains: 待操作的转移域名列表
    :param domain: 失效的域名数据
    :return: 移除后的转移域名列表
    """
    for transDomain in transDomains:
        if transDomain['domainName'] == domain['domainName'] and transDomain['transFlag'] == domain['transFlag'] \
                and transDomain['ipv4'] == domain['ipv4'] and transDomain['ipv6'] == domain['ipv6'] and transDomain['ownerAddr'] == domain['ownerAddr'] \
                and transDomain['transIpv4'] == domain['transIpv4'] and transDomain['transIpv6'] == domain['transIpv6'] and transDomain['transAddr'] == domain['transAddr'] \
                and transDomain['validFlag'] == domain['validFlag']:
            transDomains.remove(transDomain)
            return transDomains
    return transDomains

@app.route('/broadcast/mineOk', methods=['GET'])
def mine_broadcast():
    blockchain.resolve_conflicts()

    transDomains=blockchain.current_trans_domains
    for block in blockchain.chain:
        for domain in block['domains']:
            if domain['validFlag'] and domain['transFlag']>0:
                transDomains=remove_invalid_trans_domain(transDomains, domain)

    f = open(filepath + blockchain.transTemp_file, 'w')
    f.write(json.dumps({
        'transTemp': transDomains
    }))
    f.close()

    return "Resolve Conflicts OK, Blockchain Update", 200


# 新增域名
@app.route('/domains/new', methods=['POST'])
def new_transaction():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'validFlag', 'ownerAddr', 'timestamp']
    if not all(k in values for k in required):
        response = {
            'message': 'missing values',
        }
        return jsonify(response), 400

    blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], values['validFlag'],
                               values['ownerAddr'], values['timestamp'])

    response = {
        'message': 'add new transaction success',
    }
    return jsonify(response), 201

# 查看整个区块链
@app.route('/chain', methods=['GET'])
def full_chain():
    response = {
        'chain': blockchain.chain,
        'length': blockchain.length,
    }
    return jsonify(response), 200

# 节点注册
@app.route('/nodes/register', methods=['POST'])
def register_nodes():
    values = request.get_json()

    nodes = values.get('nodes')
    if nodes is None:
        return "Error: Please supply a valid list of nodes", 400

    for node in nodes:
        blockchain.register_node(node)

    response = {
        'message': 'New nodes have been added',
        'total_nodes': list(blockchain.nodes),
    }
    return jsonify(response), 201

# 解决冲突
@app.route('/nodes/resolve', methods=['GET'])
def consensus():
    replaced = blockchain.resolve_conflicts()

    if replaced:
        response = {
            'message': 'Our chain was replaced',
            'new_chain': blockchain.chain
        }
    else:
        response = {
            'message': 'Our chain is authoritative',
            'chain': blockchain.chain
        }

    return jsonify(response), 200


# api for dns

def remove_invalid_domain(total: int, domains: List[Dict[str, Any]], domain: Dict[str, Any]) -> int:
    for data in domains:
        if data['domainName'] == domain['domainName']:
            domains.remove(data)
            total -= 1
            return total
    return total


def return_valid_domainnames():
    domainnames = set()

    for block in blockchain.chain:
        for domain in block['domains']:
            if domain['validFlag']:
                domainnames.add(domain['domainName'])
            if not domain['validFlag'] and domain['domainName'] in domainnames:
                domainnames.remove(domain['domainName'])
    return domainnames

def return_owned_domainnames():
    domainnames = set()

    for block in blockchain.chain:
        for domain in block['domains']:
            if not domain['validFlag'] and domain['domainName'] in domainnames:
                if domain['transFlag'] == 0 and domain['ownerAddr'] == node_identifier:
                    domainnames.remove(domain['domainName'])
                elif domain['transFlag'] > 0 and domain['transAddr'] == node_identifier:
                    domainnames.remove(domain['domainName'])
            if domain['validFlag']:
                if domain['transFlag'] == 0 and domain['ownerAddr'] == node_identifier:
                    domainnames.add(domain['domainName'])
                if domain['transFlag'] > 0:
                    if domain['transAddr'] == node_identifier:
                        domainnames.add(domain['domainName'])
                    elif domain['ownerAddr'] == node_identifier and domain['transAddr'] != node_identifier:
                        domainnames.remove(domain['domainName'])
    return domainnames


def return_trans_domainname_data(domainname: str) -> Dict[str, Any]:
    domaindata = dict()
    for block in blockchain.chain[::-1]:
        for domain in block['domains']:
            if domain['validFlag'] and domain['domainName'] == domainname:
                domaindata = domain.copy()
                return domaindata
    return domaindata


def return_own_domain():
    domains = []
    total = 0

    for block in blockchain.chain:
        for domain in block['domains']:
            if domain['validFlag'] and (domain['ownerAddr'] == node_identifier or domain['transAddr'] == node_identifier):
                data = dict()
                data['block'] = block['index']
                data['domainName'] = domain['domainName']
                data['confirm'] = domain['confirm']
                if domain['transFlag'] == 0:
                    data['transFlag'] = domain['transFlag']
                    data['ipv4'] = domain['ipv4']
                    data['ipv6'] = domain['ipv6']
                    data['ownerAddr'] = domain['ownerAddr']
                    data['timestamp'] = domain['timestamp']
                    domains.append(data)
                    total += 1
                if domain['transFlag'] == 1 and domain['transAddr'] == node_identifier:
                    data['transFlag'] = domain['transFlag']
                    data['ipv4'] = domain['transIpv4']
                    data['ipv6'] = domain['transIpv6']
                    data['ownerAddr'] = domain['transAddr']
                    data['timestamp'] = domain['transTimestamp']
                    domains.append(data)
                    total += 1
                if domain['transFlag'] > 1 and domain['transAddr'] == node_identifier:
                    for domaindata in domains:
                        if domaindata['domainName'] == domain['domainName']:
                            domaindata['block'] = block['index']
                            domaindata['transFlag'] = domain['transFlag']
                            domaindata['ipv4'] = domain['transIpv4']
                            domaindata['ipv6'] = domain['transIpv6']
                            domaindata['ownerAddr'] = domain['transAddr']
                            domaindata['timestamp'] = domain['transTimestamp']
                            break

            if (not domain['validFlag']) or (domain['transFlag'] == 1 and domain['ownerAddr'] == node_identifier
                                             and domain['transAddr'] != node_identifier):
                total = remove_invalid_domain(total, domains, domain)

    domains.reverse()
    response = {
        'list': domains,
        'pagination': {
            'total': total,
            'pageSize': 10,
        }
    }
    return response

def return_all_domain():
    domains = []
    total = 0

    for block in blockchain.chain:
        for domain in block['domains']:
            if domain['validFlag']:
                if domain['transFlag'] == 0:
                    if domain['domainName'] not in domains:
                        data = dict()
                        data['block'] = block['index']
                        data['domainName'] = domain['domainName']
                        data['confirm'] = domain['confirm']
                        data['transFlag'] = domain['transFlag']
                        data['ipv4'] = domain['ipv4']
                        data['ipv6'] = domain['ipv6']
                        data['ownerAddr'] = domain['ownerAddr']
                        data['timestamp'] = domain['timestamp']
                        domains.append(data)
                        total += 1
                    else:
                        for domaindata in domains:
                            if domaindata['domainName'] == domain['domainName']:
                                domaindata['block'] = block['index']
                                domaindata['ipv4'] = domain['ipv4']
                                domaindata['ipv6'] = domain['ipv6']
                                break
                if domain['transFlag'] == 1:
                    for domaindata in domains:
                        if domaindata['domainName'] == domain['domainName']:
                            domaindata['block'] = block['index']
                            domaindata['transFlag'] = domain['transFlag']
                            domaindata['ipv4'] = domain['transIpv4']
                            domaindata['ipv6'] = domain['transIpv6']
                            domaindata['ownerAddr'] = domain['transAddr']
                            domaindata['timestamp'] = domain['transTimestamp']
                            break
                if domain['transFlag'] > 1:
                    for domaindata in domains:
                        if domaindata['domainName'] == domain['domainName']:
                            domaindata['block'] = block['index']
                            domaindata['transFlag'] = domain['transFlag']
                            domaindata['ipv4'] = domain['transIpv4']
                            domaindata['ipv6'] = domain['transIpv6']
                            domaindata['ownerAddr'] = domain['transAddr']
                            domaindata['timestamp'] = domain['transTimestamp']
                            break

            if not domain['validFlag']:
                total = remove_invalid_domain(total, domains, domain)

    domains.reverse()
    response = {
        'list': domains,
        'pagination': {
            'total': total,
            'pageSize': 10,
        }
    }
    return response

def return_all_domain_nameorip(domainName: str, ipv4: str, ipv6: str):
    domains = []
    total = 0

    for block in blockchain.chain:
        for domain in block['domains']:
            if domain['validFlag']:
                if domain['transFlag'] == 0:
                    if domain['domainName'] not in domains:
                        data = dict()
                        data['block'] = block['index']
                        data['domainName'] = domain['domainName']
                        data['confirm'] = domain['confirm']
                        data['transFlag'] = domain['transFlag']
                        data['ipv4'] = domain['ipv4']
                        data['ipv6'] = domain['ipv6']
                        data['ownerAddr'] = domain['ownerAddr']
                        data['timestamp'] = domain['timestamp']
                        domains.append(data)
                        total += 1
                    else:
                        for domaindata in domains:
                            if domaindata['domainName'] == domain['domainName']:
                                domaindata['block'] = block['index']
                                domaindata['ipv4'] = domain['ipv4']
                                domaindata['ipv6'] = domain['ipv6']
                                break
                if domain['transFlag'] == 1:
                    for domaindata in domains:
                        if domaindata['domainName'] == domain['domainName']:
                            domaindata['block'] = block['index']
                            domaindata['transFlag'] = domain['transFlag']
                            domaindata['ipv4'] = domain['transIpv4']
                            domaindata['ipv6'] = domain['transIpv6']
                            domaindata['ownerAddr'] = domain['transAddr']
                            domaindata['timestamp'] = domain['transTimestamp']
                            break
                if domain['transFlag'] > 1:
                    for domaindata in domains:
                        if domaindata['domainName'] == domain['domainName']:
                            domaindata['block'] = block['index']
                            domaindata['transFlag'] = domain['transFlag']
                            domaindata['ipv4'] = domain['transIpv4']
                            domaindata['ipv6'] = domain['transIpv6']
                            domaindata['ownerAddr'] = domain['transAddr']
                            domaindata['timestamp'] = domain['transTimestamp']
                            break

            if not domain['validFlag']:
                total = remove_invalid_domain(total, domains, domain)

    for domain in domains[::-1]:
        if domain['domainName'] != domainName and domain['ipv4'] != ipv4 and domain['ipv6'] != ipv6:
            domains.remove(domain)
            total -= 1

    domains.reverse()
    response = {
        'list': domains,
        'pagination': {
            'total': total,
            'pageSize': 10,
        }
    }
    return response


def return_query_confirm():
    with open(filepath + blockchain.temp_file, 'r') as f:
        tempdata = json.load(f)['temp']

    domains = []
    total = 0

    for domain in tempdata:
        if domain['validFlag']:
            if domain['transFlag'] == 0:
                data = dict()
                data['domainName'] = domain['domainName']
                data['transFlag'] = domain['transFlag']
                data['ipv4'] = domain['ipv4']
                data['ipv6'] = domain['ipv6']
                data['ownerAddr'] = domain['ownerAddr']
                data['timestamp'] = domain['timestamp']
                data['confirm'] = domain['confirm']
                domains.append(data)
                total += 1
            if domain['transFlag'] > 0:
                data = dict()
                data['domainName'] = domain['domainName']
                data['transFlag'] = domain['transFlag']
                data['ipv4'] = domain['transIpv4']
                data['ipv6'] = domain['transIpv6']
                data['ownerAddr'] = domain['transAddr']
                data['timestamp'] = domain['transTimestamp']
                data['confirm'] = domain['confirm']
                domains.append(data)
                total += 1

    domains.reverse()
    response = {
        'list': domains,
        'pagination': {
            'total': total,
            'pageSize': 10,
        }
    }
    return response

# 申请的转移域名数据
@app.route('/dns/trans/apply', methods=['GET'])
def return_trans_apply():
    try:
        with open(filepath + blockchain.transTemp_file, 'r') as f:
            data = json.load(f)['transTemp']
            for domaindata in data:
                if domaindata['transAddr'] != node_identifier:
                    data.remove(domaindata)
            data.reverse()
    except json.decoder.JSONDecodeError:
        data = []
    response = {
        'list': data,
        'pagination': {
            'total': len(data),
            'pageSize': 10,
        }
    }
    return jsonify(response), 200

# 被申请的域名数据
def return_trans_applied_data():
    try:
        with open(filepath + blockchain.transTemp_file, 'r') as f:
            data = json.load(f)['transTemp']
            for domaindata in data:
                if domaindata['transAddr'] == node_identifier:
                    data.remove(domaindata)
            data.reverse()
    except json.decoder.JSONDecodeError:
        data = []
    response = {
        'list': data,
        'pagination': {
            'total': len(data),
            'pageSize': 10,
        }
    }
    return response

# 接收到的转移申请
@app.route('/dns/trans/applied', methods=['GET'])
def return_trans_applied():
    return jsonify(return_trans_applied_data()), 200


# 获取节点地址
@app.route('/dns/queryInfo', methods=['GET'])
def query_info():
    return jsonify({
        'nodeId': node_identifier
    }), 200

# 所有有效域名
@app.route('/dns/domain/queryall', methods=['GET'])
def query_all_domain():
    domainName = request.args.get('domainName')
    ipv4 = request.args.get('ipv4')
    ipv6 = request.args.get('ipv6')
    if domainName or ipv4 or ipv6:
        return jsonify(return_all_domain_nameorip(domainName, ipv4, ipv6)), 200
    else:
        return jsonify(return_all_domain()), 200

# 本节点的有效域名
@app.route('/dns/domain/queryown', methods=['GET'])
def query_own_domain():
    return jsonify(return_own_domain()), 200


# 申请域名
@app.route('/dns/domain/apply', methods=['POST'])
def apply_domain():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6']
    if not all(k in values for k in required):
        return 'Missing values', 400

    timestamp = int(round(time() * 1000))

    if values['domainName'] in return_valid_domainnames():
        response = "false"
        return response, 200
    else:
        blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], True, node_identifier, timestamp)
        response = "true"
        return response, 201


def required_data(domainvalues: Dict[str, Any]) -> Dict[str, Any]:
    for domain in blockchain.chain[domainvalues['block']-1]['domains']:
        if domain['validFlag'] and domain['domainName'] == domainvalues['domainName'] and domain['transFlag'] == domainvalues['transFlag']:
            if domainvalues['transFlag'] == 0 and domain['ipv4'] == domainvalues['ipv4'] and domain['ipv6'] == domainvalues['ipv6'] and domain['ownerAddr'] == domainvalues['ownerAddr']:
                domainvalues['transIpv4'] = domain['transIpv4']
                domainvalues['transIpv6'] = domain['transIpv6']
                domainvalues['transAddr'] = domain['transAddr']
                domainvalues['transTimestamp'] = domain['transTimestamp']
            if domainvalues['transFlag'] > 0 and domain['transIpv4'] == domainvalues['ipv4'] and domain['transIpv6'] == domainvalues['ipv6'] and domain['transAddr'] == domainvalues['ownerAddr']:
                domainvalues['ipv4'] = domain['ipv4']
                domainvalues['ipv6'] = domain['ipv6']
                domainvalues['ownerAddr'] = domain['ownerAddr']
                domainvalues['timestamp'] = domain['timestamp']
                domainvalues['transIpv4'] = domain['transIpv4']
                domainvalues['transIpv6'] = domain['transIpv6']
                domainvalues['transAddr'] = domain['transAddr']
                domainvalues['transTimestamp'] = domain['transTimestamp']
    return domainvalues

# 域名--更新域名
@app.route('/dns/domain/update', methods=['POST'])
def update_domain():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'ownerAddr', 'timestamp', 'newIpv4', 'newIpv6', 'transFlag', 'block']
    if not all(k in values for k in required):
        return 'Missing values', 400

    required_data(values)

    if values['transFlag'] == 0:
        blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], False, values['ownerAddr'], values['timestamp'],
                               values['transFlag'], values['transIpv4'], values['transIpv6'], values['transAddr'], values['transTimestamp'])
        blockchain.new_transaction(values['domainName'], values['newIpv4'], values['newIpv6'], True, values['ownerAddr'], values['timestamp'],
                               values['transFlag'], values['transIpv4'], values['transIpv6'], values['transAddr'], values['transTimestamp'])

    if values['transFlag'] > 0:
        blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], False, values['ownerAddr'], values['timestamp'],
                               values['transFlag'], values['transIpv4'], values['transIpv6'], values['transAddr'], values['transTimestamp'])
        blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], True, values['ownerAddr'], values['timestamp'],
                               values['transFlag'], values['newIpv4'], values['newIpv6'], values['transAddr'], values['transTimestamp'])

    return jsonify(return_own_domain()), 201

# 域名--注销域名
@app.route('/dns/domain/delete', methods=['POST'])
def delete_domain():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'ownerAddr', 'timestamp', 'transFlag', 'block']
    if not all(k in values for k in required):
        return 'Missing values', 400

    required_data(values)

    blockchain.new_transaction(values['domainName'], values['ipv4'], values['ipv6'], False, values['ownerAddr'], values['timestamp'],
                               values['transFlag'], values['transIpv4'], values['transIpv6'], values['transAddr'], values['transTimestamp'])

    return jsonify(return_own_domain()), 201

# 申请转移
@app.route('/dns/trans/transfer', methods=['POST'])
def trans_domain():
    values = request.get_json()

    required = ['transDomainName', 'transIpv4', 'transIpv6']
    if not all(k in values for k in required):
        return 'Missing values', 400

    timestamp = int(round(time() * 1000))

    if values['transDomainName'] not in return_valid_domainnames():
        response = "-1"
        return response, 200

    if values['transDomainName'] in return_owned_domainnames():
        response = "0"
        return response, 200
    else:
        domaindata = return_trans_domainname_data(values['transDomainName'])
        if domaindata['transFlag'] == 0:
            blockchain.new_trans_transaction(domaindata['domainName'], domaindata['ipv4'], domaindata['ipv6'], True, domaindata['ownerAddr'],
                                       domaindata['timestamp'], domaindata['transFlag']+1, values['transIpv4'], values['transIpv6'],
                                       node_identifier, timestamp)
            data = {
                'domainName': domaindata['domainName'],
                'ipv4': domaindata['ipv4'],
                'ipv6': domaindata['ipv6'],
                'validFlag': True,
                'ownerAddr': domaindata['ownerAddr'],
                'timestamp': domaindata['timestamp'],
                'transFlag': domaindata['transFlag']+1,
                'transIpv4': values['transIpv4'],
                'transIpv6': values['transIpv6'],
                'transAddr': node_identifier,
                'transTimestamp': timestamp,
            }
        if domaindata['transFlag'] > 0:
            blockchain.new_trans_transaction(domaindata['domainName'], domaindata['transIpv4'], domaindata['transIpv6'], True, domaindata['transAddr'],
                                       domaindata['transTimestamp'], domaindata['transFlag']+1, values['transIpv4'], values['transIpv6'],
                                       node_identifier, timestamp)
            data = {
                'domainName': domaindata['domainName'],
                'ipv4': domaindata['transIpv4'],
                'ipv6': domaindata['transIpv6'],
                'validFlag': True,
                'ownerAddr': domaindata['transAddr'],
                'timestamp': domaindata['transTimestamp'],
                'transFlag': domaindata['transFlag'] + 1,
                'transIpv4': values['transIpv4'],
                'transIpv6': values['transIpv6'],
                'transAddr': node_identifier,
                'transTimestamp': timestamp,
            }
        with open(filepath + nodeNet_file, 'r') as f:
            nodeNet = json.load(f)['nodeNet']
        for node in nodeNet:
            if data['ownerAddr'] == node['nodeAddr']:
                try:
                    net = node['net']
                    headers = {
                        "Content-Type": "application/json"
                    }
                    requests.post(f'http://{net}/broadcast/trans/transfer', data=json.dumps(data), headers=headers)
                except:
                    continue

        response = "1"
        return response, 201

# 转移域名
@app.route('/broadcast/trans/transfer', methods=['POST'])
def trans_broadcast():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'validFlag', 'ownerAddr', 'timestamp', 'transFlag', 'transIpv4', 'transIpv6', 'transAddr', 'transTimestamp']
    if not all(k in values for k in required):
        return 'Missing values', 400

    if values['domainName'] not in return_owned_domainnames() or values['ownerAddr'] != node_identifier:
        response = "not owned"
        return response, 200

    else:
        blockchain.new_trans_transaction(values['domainName'], values['ipv4'], values['ipv6'], values['validFlag'],
                                         values['ownerAddr'], values['timestamp'], values['transFlag'],
                                         values['transIpv4'], values['transIpv6'], values['transAddr'], values['transTimestamp'])
        response = "true"
        return response, 201

# 确认域名
@app.route('/dns/confirm/query', methods=['GET'])
def upload_confirm():
    return jsonify(return_query_confirm()), 200


# 确认域名操作
@app.route('/dns/confirm/confirm', methods=['POST'])
def confirm():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'ownerAddr', 'transFlag', 'nodeId']
    if not all(k in values for k in required):
        return 'Missing values', 400

    if values['transFlag'] == 0:
        for current in blockchain.current_domains:
            if current['validFlag'] and current['domainName'] == values['domainName'] \
                    and current['ipv4'] == values['ipv4'] and current['ipv6'] == values['ipv6'] and current['ownerAddr'] == values['ownerAddr'] and current['transFlag'] == 0:
                current['confirm'].append(values['nodeId'])
                break

    if values['transFlag'] > 0:
        for current in blockchain.current_domains:
            if current['validFlag'] and current['domainName'] == values['domainName'] \
                    and current['transIpv4'] == values['ipv4'] and current['transIpv6'] == values['ipv6'] and current['transAddr'] == values['ownerAddr'] and current['transFlag'] == values['transFlag']:
                current['confirm'].append(values['nodeId'])
                break

    f = open(filepath + blockchain.temp_file, 'w')
    f.write(json.dumps({
        'temp': blockchain.current_domains
    }))
    f.close()

    return jsonify(return_query_confirm()), 201


# 转移域名确认操作
@app.route('/dns/trans/confirm', methods=['POST'])
def trans_confirm():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'transFlag', 'ownerAddr', 'transIpv4', 'transIpv6', 'nodeId']
    if not all(k in values for k in required):
        return 'Missing values', 400

    for current in blockchain.current_trans_domains:
        if current['validFlag'] and current['ownerAddr'] == values['ownerAddr'] \
                and current['domainName'] == values['domainName'] and current['ipv4'] == values['ipv4'] and current['ipv6'] == values['ipv6'] \
                and current['transFlag'] == values['transFlag'] and current['transIpv4'] == values['transIpv4'] and current['transIpv6'] == values['transIpv6']:
            current['confirm'].append(values['nodeId'])
            data = {
                'domainName': current['domainName'],
                'ipv4': current['ipv4'],
                'ipv6': current['ipv6'],
                'validFlag': True,
                'ownerAddr': current['ownerAddr'],
                'timestamp': current['timestamp'],
                'transFlag': current['transFlag'],
                'transIpv4': current['transIpv4'],
                'transIpv6': current['transIpv6'],
                'transAddr': current['transAddr'],
                'transTimestamp': current['transTimestamp'],
                'confirmNodeId': values['nodeId'],
            }
            break

    f = open(filepath + blockchain.transTemp_file, 'w')
    f.write(json.dumps({
        'transTemp': blockchain.current_trans_domains
    }))
    f.close()

    with open(filepath + nodeNet_file, 'r') as f:
        nodeNet = json.load(f)['nodeNet']
    for node in nodeNet:
        if data['transAddr'] == node['nodeAddr']:
            try:
                net = node['net']
                headers = {
                    "Content-Type": "application/json"
                }
                requests.post(f'http://{net}/broadcast/trans/confirm', data=json.dumps(data), headers=headers)
            except:
                continue

    return jsonify(return_trans_applied_data()), 201

# 确认转移域名
@app.route('/broadcast/trans/confirm', methods=['POST'])
def trans_confirm_broadcast():
    values = request.get_json()

    required = ['domainName', 'ipv4', 'ipv6', 'validFlag', 'ownerAddr', 'timestamp', 'transFlag', 'transIpv4', 'transIpv6', 'transAddr', 'transTimestamp', 'confirmNodeId']
    if not all(k in values for k in required):
        return 'Missing values', 400

    if values['transAddr'] != node_identifier:
        response = "not apply trans"
        return response, 200

    else:
        for current in blockchain.current_trans_domains:
            if current['validFlag'] and current['ownerAddr'] == values['ownerAddr'] \
                    and current['domainName'] == values['domainName'] and current['ipv4'] == values['ipv4'] and current['ipv6'] == values['ipv6'] \
                    and current['transFlag'] == values['transFlag'] and current['transIpv4'] == values['transIpv4'] and current['transIpv6'] == values['transIpv6']:
                current['confirm'].append(values['confirmNodeId'])
                break
        f = open(filepath + blockchain.transTemp_file, 'w')
        f.write(json.dumps({
            'transTemp': blockchain.current_trans_domains
        }))
        f.close()
        response = "true"
        return response, 201

@app.route('/dns/user/queryInfo', methods=['GET'])
def info():
    mine_num = 0
    create_domainname = set()
    apply_trans_domainname = set()
    confirm_num = 0
    for block in blockchain.chain:
        if block['miner'] == node_identifier:
            mine_num += 1
            for domain in block['domains']:
                if domain['ownerAddr'] == node_identifier and domain['transFlag'] == 0:
                    create_domainname.add(domain['domainName'])
                if domain['validFlag'] and domain['transAddr'] == node_identifier and domain['transFlag'] > 0:
                    apply_trans_domainname.add(domain['domainName'])
                if node_identifier in domain['confirm']:
                    confirm_num += 1
    response = {
        'id': node_identifier,
        'mineNum': mine_num,
        'createNum': len(create_domainname),
        'applyTransNum': len(apply_trans_domainname),
        'confirmNum': confirm_num,
    }
    return jsonify(response), 200

@app.route('/dns/user/queryBlock', methods=['GET'])
def block():
    index = int(request.args.get('index'))
    if index > blockchain.length:
        index = 0
    return jsonify(blockchain.chain[index-1]), 200


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument('-p', '--port', default=5000, type=int, help='port to listen on')
    args = parser.parse_args()
    port = args.port

    app.run(host='0.0.0.0', port=port)
