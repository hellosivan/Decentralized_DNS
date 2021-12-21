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
  Divider,
} from 'antd';
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
    const { modalVisible, current = {}, form, handleSubmit, handleModalVisible } = this.props;
    const width = 600;
    let isCurrent = false;
    if (JSON.stringify(current) !== '{}') {
      isCurrent = true;
    }

    const okHandle = () => {
      form.validateFields((err, fieldsValue) => {
        if (err) return;
        form.resetFields();
        handleSubmit(fieldsValue);
      });
    };

    const cancelHandel = () => {
      handleModalVisible();
    };

    const extendsFields = [];
    if (isCurrent) {
      extendsFields.push(
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所属节点">
          {form.getFieldDecorator('ownerAddr', {
            initialValue: current.ownerAddr,
          })(<Input disabled="true" />)}
        </FormItem>,
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="转移标志">
          {form.getFieldDecorator('transFlag', {
            initialValue: current.transFlag,
          })(<Input disabled={true} />)}
        </FormItem>,
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="申请时间">
          {form.getFieldDecorator('timestamp', {
            initialValue: moment(current.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          })(<Input disabled={true} />)}
        </FormItem>,
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="确认节点">
          {form.getFieldDecorator('confirm', {
            initialValue: current.confirm,
          })(<Input disabled={true} />)}
        </FormItem>,
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所在区块">
          {form.getFieldDecorator('block', {
            initialValue: current.block,
          })(<Input disabled={true} />)}
        </FormItem>
      );
    }

    return (
      <Modal
        width={width}
        destroyOnClose
        title={`${isCurrent ? '查看' : '申请'}域名`}
        visible={modalVisible}
        okText={isCurrent ? '确定' : '申请'}
        onOk={isCurrent ? cancelHandel : okHandle}
        onCancel={cancelHandel}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="域名">
          {form.getFieldDecorator('domainName', {
            initialValue: current.domainName,
            rules: [{ required: true, message: '域名不能为空！' }],
          })(<Input placeholder="请输入域名" disabled={isCurrent} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv4地址">
          {form.getFieldDecorator('ipv4', {
            initialValue: current.ipv4,
            rules: [{ required: true, message: '服务器IPv4地址不能为空！' }],
          })(<Input placeholder="请输入域名服务器的IPv4地址" disabled={isCurrent} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv6地址">
          {form.getFieldDecorator('ipv6', {
            initialValue: current.ipv6,
            rules: [{ required: true, message: '服务器IPv6地址不能为空！' }],
          })(<Input placeholder="请输入域名服务器的IPv6地址" disabled={isCurrent} />)}
        </FormItem>
        {extendsFields}
      </Modal>
    );
  }
}

@connect(({ operating, loading }) => ({
  operating,
  loading: loading.models.operating,
}))


@Form.create()
class TableList extends PureComponent {
  state = {
    modalVisible: false,
    modalUpdateVisible: false,
    modalDeleteVisible: false,
    formValues: {},
    current: {},
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'operating/queryData',
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
        type: 'operating/queryData',
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

  handleSubmit = fields => {
    const { dispatch } = this.props;
    dispatch({
      type: 'operating/applyOne',
      payload: {
        ...fields,
      },
    }).then(
      applyResult =>{
        if (applyResult === true) {
              message.success('申请成功！请前往域名管理进行域名确认！');
        }
        if (applyResult === false) {
              message.error('申请失败！该域名已被申请，请申请其他域名！');
        }
      }
    )
    this.handleModalVisible();
  };


  showEditModal = Item => {
    this.setState({
      modalVisible: true,
      current: Item,
    });
  };


  setModalUpdateVisible= flag => {
    this.setState({
      modalUpdateVisible: !!flag,
      current: undefined,
    });
  };

  showUpdateModal = Item => {
    this.setState({
      modalUpdateVisible: true,
      current: Item,
    });
  };

  okHandleUpdate = () => {
    const { form, dispatch } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      dispatch({
        type: 'operating/updateOne',
        payload: {
          ...fieldsValue,
        },
      });
      message.success('更新成功！请前往域名管理进行域名确认！');
      this.setModalUpdateVisible();
    });
  };

  setModalDeleteVisible= flag => {
    this.setState({
      modalDeleteVisible: !!flag,
      current: undefined,
    });
  };

  okHandleDelete = () => {
    const { form, dispatch } = this.props;
    form.validateFields(['domainName', 'ipv4', 'ipv6', 'ownerAddr', 'timestamp', 'transFlag', 'confirm', 'block'], (err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      dispatch({
        type: 'operating/deleteOne',
        payload: {
          ...fieldsValue,
        },
      });
      message.success('注销成功！请前往个人中心打包新区块，生效域名注销操作！');
      this.setModalDeleteVisible();
    });
  };

  showDeleteModal = Item => {
    this.setState({
      modalDeleteVisible: true,
      current: Item,
    });
  };


  domainUpdate = () => {
    const width = 600;
    const { modalUpdateVisible, current = {} } = this.state;
    const { form } = this.props;

    return (
      <Modal
        width={width}
        destroyOnClose
        title="更新域名信息"
        visible={modalUpdateVisible}
        okText="更新"
        onOk={this.okHandleUpdate}
        onCancel={() => this.setModalUpdateVisible(false)}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="域名">
          {form.getFieldDecorator('domainName', {
            initialValue: current.domainName,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="原IPv4">
          {form.getFieldDecorator('ipv4', {
            initialValue: current.ipv4,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="原IPv6">
          {form.getFieldDecorator('ipv6', {
            initialValue: current.ipv6,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="新IPv4">
          {form.getFieldDecorator('newIpv4', {
            rules: [{ required: true, message: '服务器IPv4不能为空！' }],
          })(<Input placeholder="请输入域名服务器IPv4的更新值" disabled={false} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="新IPv6">
          {form.getFieldDecorator('newIpv6', {
            rules: [{ required: true, message: '服务器IPv6不能为空！' }],
          })(<Input placeholder="请输入域名服务器IPv6的更新值" disabled={false} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所属节点">
          {form.getFieldDecorator('ownerAddr', {
            initialValue: current.ownerAddr,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="转移标志">
          {form.getFieldDecorator('transFlag', {
            initialValue: current.transFlag,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="申请时间">
          {form.getFieldDecorator('timestamp', {
            initialValue: moment(current.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          })(<Input disabled={true} />)}
        </FormItem>
      </Modal>
    );
  };


  domainDelete = () => {
    const width = 600;
    const { modalDeleteVisible, current = {} } = this.state;
    const { form } = this.props;


    return (
      <Modal
        width={width}
        destroyOnClose
        title="注销域名"
        visible={modalDeleteVisible}
        okText="注销"
        onOk={this.okHandleDelete}
        onCancel={() => this.setModalDeleteVisible(false)}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="域名">
          {form.getFieldDecorator('domainName', {
            initialValue: current.domainName,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv4地址">
          {form.getFieldDecorator('ipv4', {
            initialValue: current.ipv4,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="服务器IPv6地址">
          {form.getFieldDecorator('ipv6', {
            initialValue: current.ipv6,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所属节点">
          {form.getFieldDecorator('ownerAddr', {
            initialValue: current.ownerAddr,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="转移标志">
          {form.getFieldDecorator('transFlag', {
            initialValue: current.transFlag,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="申请时间">
          {form.getFieldDecorator('timestamp', {
            initialValue: moment(current.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="确认节点">
          {form.getFieldDecorator('confirm', {
            initialValue: current.confirm,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="所在区块">
          {form.getFieldDecorator('block', {
            initialValue: current.block,
          })(<Input disabled={true} />)}
        </FormItem>
      </Modal>
    );
  };

  render() {
    const {
      operating: { data },
      loading,
    } = this.props;

    const { modalVisible,  current = {} } = this.state;

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
        render: (text, record) => (
          <Fragment>
            <a onClick={() => this.showEditModal(record)}>查看</a>
            <Divider type="vertical" />
            <a onClick={() => this.showUpdateModal(record)}>更新</a>
            <Divider type="vertical" />
            <a onClick={() => this.showDeleteModal(record)}>注销</a>
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="域名操作">
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                申请
              </Button>
            </div>
            <StandardTable
              loading={loading}
              data={data}
              columns={columns}
              onChange={this.handleStandardTableChange}
            />
          </div>
          <div>{this.domainUpdate()}</div>
          <div>{this.domainDelete()}</div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} current={current} />

      </PageHeaderWrapper>
    );
  }
}

export default TableList;
