import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Card,
  Form,
  Input,
  Button,
  Modal,
  message,
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './index.less';

const FormItem = Form.Item;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

@connect(({ transfering, loading }) => ({
  transfering,
  loading: loading.models.transfering,
}))


@Form.create()
class TableList extends PureComponent {
  state = {
    modalTransApplyVisible: false,
    formValues: {},
    current: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'transfering/queryDataApply',
    });
    dispatch({
      type: 'transfering/queryDataApplied',
    });
    dispatch({
      type: 'transfering/queryInfo',
    });
  }

  handleStandardTableChangeApply = (pagination, filtersArg, sorter) => {
    const { dispatch, form } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    form.validateFields((err, fieldsValue) => {
      dispatch({
        type: 'transfering/queryDataApply',
        payload: {
          ...params,
          ...fieldsValue,
        },
      });
    });
  };

  handleStandardTableChangeApplied = (pagination, filtersArg, sorter) => {
    const { dispatch, form } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    form.validateFields((err, fieldsValue) => {
      dispatch({
        type: 'transfering/queryDataApplied',
        payload: {
          ...params,
          ...fieldsValue,
        },
      });
    });
  };

  setModalTransApplyVisible = flag => {
    this.setState({
      modalTransApplyVisible: !!flag,
      current: undefined,
    });
  };

  HandleTransApply = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'transfering/applyTrans',
      payload: {
        ...fields,
      },
    }).then(
      transApplyResult =>{
        if (transApplyResult === 1) {
              message.success('申请成功！请等待该域名所属用户节点同意转移域名！');
        }
        if (transApplyResult === -1) {
              message.error('申请失败！该域名未被其他节点申请，无法进行域名转移！');
        }
        if (transApplyResult === 0) {
              message.error('申请失败！该域名您已拥有，请申请其他域名！');
        }
      }
    )
    this.setModalTransApplyVisible();
  };

  domainTransApply = () => {
    const width = 600;
    const { modalTransApplyVisible } = this.state;
    const { form } = this.props;

    const okHandle = () => {
      form.validateFields((err, fieldsValue) => {
        if (err) return;
        form.resetFields();
        this.HandleTransApply(fieldsValue);
      });
    };

    return (
      <Modal
        width={width}
        destroyOnClose
        title="申请转移域名"
        visible={modalTransApplyVisible}
        okText="申请转移"
        onOk={okHandle}
        onCancel={() => this.setModalTransApplyVisible(false)}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="申请转移的域名">
          {form.getFieldDecorator('transDomainName', {
            rules: [{ required: true, message: '域名不能为空！' }],
          })(<Input placeholder="请输入申请转移的域名" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv4地址">
          {form.getFieldDecorator('transIpv4', {
            rules: [{ required: true, message: '服务器IPv4地址不能为空！' }],
          })(<Input placeholder="请输入域名服务器的IPv4地址" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv6地址">
          {form.getFieldDecorator('transIpv6', {
            rules: [{ required: true, message: '服务器IPv6地址不能为空！' }],
          })(<Input placeholder="请输入域名服务器的IPv6地址" />)}
        </FormItem>
      </Modal>
    );
  };

  confirmTrans = (domainName, ipv4, ipv6, transFlag, ownerAddr, transIpv4, transIpv6, nodeId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'transfering/confirmTrans',
      payload: {
        domainName,
        ipv4,
        ipv6,
        transFlag,
        ownerAddr,
        transIpv4,
        transIpv6,
        nodeId,
      },
    });
  };

  handleConfirmTrans = (Item, nodeId) => {
    Modal.confirm({
      title: '确认域名信息',
      content: '要确认该域名信息吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => this.confirmTrans(Item.domainName, Item.ipv4, Item.ipv6, Item.transFlag, Item.ownerAddr, Item.transIpv4, Item.transIpv6, nodeId),
    });
  };

  render() {
    const {
      transfering: { dataApply, dataApplied, info },
      loading,
    } = this.props;

    let id = '';
    if (info) {
      id = info.nodeId;
    }

    const columnsApply = [
      {
        title: '域名',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '当前服务器IPv4地址',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '当前服务器IPv6地址',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '当前所属节点',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '转移的服务器IPv4地址',
        dataIndex: 'transIpv4',
        align: 'center',
      },
      {
        title: '转移的服务器IPv6地址',
        dataIndex: 'transIpv6',
        align: 'center',
      },
      {
        title: '申请转移节点',
        dataIndex: 'transAddr',
        align: 'center',
      },
      {
        title: '申请转移时间',
        dataIndex: 'transTimestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '转移状态',
        dataIndex: 'confirm',
        align: 'center',
        render: (text, Item) => (
          <Fragment>
            {Item.confirm.includes(Item.ownerAddr) ? (
              <span>对方已确认</span>
            ) : (
              <span>待确认</span>
            )}
          </Fragment>
        ),
      },
    ];

    const columnsApplied = [
      {
        title: '域名',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '当前服务器IPv4地址',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '当前服务器IPv6地址',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '当前所属节点',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '转移的服务器IPv4地址',
        dataIndex: 'transIpv4',
        align: 'center',
      },
      {
        title: '转移的服务器IPv6地址',
        dataIndex: 'transIpv6',
        align: 'center',
      },
      {
        title: '申请转移节点',
        dataIndex: 'transAddr',
        align: 'center',
      },
      {
        title: '申请转移时间',
        dataIndex: 'transTimestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '操作',
        align: 'center',
        render: (text, Item) => (
          <Fragment>
            {Item.confirm.includes(id) ? (
              <span>已确认</span>
            ) : (
              <a onClick={() => this.handleConfirmTrans(Item, id)}>确认</a>
            )}
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="域名转移">
        <Card bordered={false}>
          <Button icon="plus" type="primary" onClick={() => this.setModalTransApplyVisible(true)}>
            申请转移域名
          </Button>
          <div>{this.domainTransApply()}</div>
          <p></p>
          <Card type="inner" title="已申请转移的域名：">
            <div className={styles.tableList}>
              <StandardTable
                loading={loading}
                data={dataApply}
                columns={columnsApply}
                onChange={this.handleStandardTableChangeApply}
              />
            </div>
          </Card>
          <p></p>
          <Card type="inner" title="接收到的域名转移申请：">
            <div className={styles.tableList}>
              <StandardTable
                loading={loading}
                data={dataApplied}
                columns={columnsApplied}
                onChange={this.handleStandardTableChangeApplied}
              />
            </div>
          </Card>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default TableList;
