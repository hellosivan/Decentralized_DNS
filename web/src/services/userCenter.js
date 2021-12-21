import request from '@/utils/request';

export async function queryInfo() {
  return request('/api/dns/user/queryInfo');
}

export async function queryBlock(data) {
  let index = '0';
  if (data) {
    index = data.blockId;
  }
  return request(`/api/dns/user/queryBlock?index=${index}`);
}

export async function mine() {
  return request('/api/mine');
}
