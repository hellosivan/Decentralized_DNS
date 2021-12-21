import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import { Card, Form, Divider, Input, Modal } from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './index.less';

const FormItem = Form.Item;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

@Form.create()
class CreateForm extends PureComponent {
  render() {
    const { modalVisible, current = {}, form, handleModalVisible } = this.props;
    const width = 600;

    const handleClick = () => {
      handleModalVisible();
    };

    return (
      <Modal
        width={width}
        destroyOnClose
        title="查看域名信息"
        visible={modalVisible}
        okText="确定"
        onOk={handleClick}
        onCancel={handleClick}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="域名">
          {form.getFieldDecorator('domainName', {
            initialValue: current.domainName,
          })(<Input disabled="true" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv4地址">
          {form.getFieldDecorator('ipv4', {
            initialValue: current.ipv4,
          })(<Input disabled="true" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv6地址">
          {form.getFieldDecorator('ipv6', {
            initialValue: current.ipv6,
          })(<Input disabled="true" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所属节点">
          {form.getFieldDecorator('ownerAddr', {
            initialValue: current.ownerAddr,
          })(<Input disabled="true" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="转移标志">
          {form.getFieldDecorator('transFlag', {
            initialValue: current.transFlag,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="申请时间">
          {form.getFieldDecorator('timestamp', {
            initialValue: moment(current.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          })(<Input disabled="true" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="确认节点">
          {form.getFieldDecorator('confirm', {
            initialValue: current.confirm,
          })(<Input disabled="true" />)}
        </FormItem>
      </Modal>
    );
  }
}

@connect(({ confirm, loading }) => ({
  confirm,
  loading: loading.models.confirm,
}))
@Form.create()
class TableList extends PureComponent {
  state = {
    modalVisible: false,
    formValues: {},
    current: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'confirm/queryData',
    });
    dispatch({
      type: 'confirm/queryInfo',
    });
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {
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
        type: 'confirm/queryData',
        payload: {
          ...params,
          ...fieldsValue,
        },
      });
    });
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
      current: undefined,
    });
  };

  confirmDomain = (domainName, ipv4, ipv6, transFlag, ownerAddr, nodeId) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'confirm/confirmOne',
      payload: {
        domainName,
        ipv4,
        ipv6,
        transFlag,
        ownerAddr,
        nodeId,
      },
    });
  };

  showEditModal = Item => {
    this.setState({
      modalVisible: true,
      current: Item,
    });
  };

  handleConfirm = (Item, nodeId) => {
    Modal.confirm({
      title: '确认域名信息',
      content: '要确认该域名信息吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => this.confirmDomain(Item.domainName, Item.ipv4, Item.ipv6, Item.transFlag, Item.ownerAddr, nodeId),
    });
  };

  render() {
    const {
      confirm: { data, info },
      loading,
    } = this.props;

    let id = '';
    if (info) {
      id = info.nodeId;
    }


    const { modalVisible, current = {} } = this.state;

    const parentMethods = {
      handleSubmit: this.handleSubmit,
      handleModalVisible: this.handleModalVisible,
    };

    const columns = [
      {
        title: '域名',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '服务器IPv4地址',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '服务器IPv6地址',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '所属节点',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '转移标志',
        dataIndex: 'transFlag',
        align: 'center',
      },
      {
        title: '申请时间',
        dataIndex: 'timestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '确认数',
        dataIndex: 'confirm',
        align: 'center',
        render: val => <span>{val.length}</span>,
      },
      {
        title: '操作',
        align: 'center',
        render: (text, Item) => (
          <Fragment>
            <a onClick={() => this.showEditModal(Item)}>查看</a>
            <Divider type="vertical" />
            {Item.confirm.includes(id) ? (
              <span>已确认</span>
            ) : (
              <a onClick={() => this.handleConfirm(Item, id)}>确认</a>
            )}
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="域名确认">
        <Card bordered={false}>
          <div classip={styles.tableList}>
            <StandardTable
              loading={loading}
              data={data}
              columns={columns}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} current={current} />
      </PageHeaderWrapper>
    );
  }
}

export default TableList;
