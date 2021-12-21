import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Card,
  Form,
  Input,
  Button,
  Modal,
} from 'antd';
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import styles from './index.less';

const FormItem = Form.Item;
const getValue = obj =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

@connect(({ parsing, loading }) => ({
  parsing,
  loading: loading.models.parsing,
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
      type: 'parsing/queryData',
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
        type: 'parsing/queryData',
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

  showEditModal = Item => {
    this.setState({
      modalVisible: true,
      current: Item,
    });
  };


  handleSearch = () => {
    const { form, dispatch } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) {
        return;
      }
      dispatch({
        type: 'parsing/queryData',
        payload: {
          ...fieldsValue,
        },
      });
    });
  };

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    form.validateFields(err => {
      if (err) {
        return;
      }
      dispatch({
        type: 'parsing/queryData',
      });
    });
  };


  parseForm = () => {
    const { form } = this.props;

    return (
      <Form layout="inline" style={{ marginBottom: '20px' }}>
        <FormItem label="域名" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchDomainName')(
            <Input placeholder="请输入待解析的域名" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem label="IPv4地址" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchIpv4')(
            <Input placeholder="请输入待解析的IPv4地址" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem label="IPv6地址" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchIpv6')(
            <Input placeholder="请输入待解析的IPv6地址" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem style={{ marginLeft: '60px' }}>
          <Button type="primary" onClick={this.handleSearch}>
            解析
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
            重置
          </Button>
        </FormItem>
      </Form>
    );
  };


  lookForm = () => {
    const width = 600;
    const { modalVisible, current = {} } = this.state;
    const { form } = this.props;

    return (
      <Modal
        width={width}
        destroyOnClose
        title="查看域名"
        visible={modalVisible}
        okText="确定"
        onOk={() => this.handleModalVisible(false)}
        onCancel={() => this.handleModalVisible(false)}
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
      parsing: { data },
      loading,
    } = this.props;

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
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="域名解析">
        <Card bordered={false}>
          <div>{this.parseForm()}</div>
          <div className={styles.tableList}>
            <StandardTable
              loading={loading}
              data={data}
              columns={columns}
              onChange={this.handleStandardTableChange}
            />
          </div>
          <div>{this.lookForm()}</div>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default TableList;
