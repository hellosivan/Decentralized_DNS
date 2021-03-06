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
        <FormItem label="??????" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchDomainName')(
            <Input placeholder="???????????????????????????" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem label="IPv4??????" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchIpv4')(
            <Input placeholder="?????????????????????IPv4??????" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem label="IPv6??????" style={{ marginRight: '30px' }}>
          {form.getFieldDecorator('searchIpv6')(
            <Input placeholder="?????????????????????IPv6??????" style={{ width: '300px' }} />
          )}
        </FormItem>
        <FormItem style={{ marginLeft: '60px' }}>
          <Button type="primary" onClick={this.handleSearch}>
            ??????
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
            ??????
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
        title="????????????"
        visible={modalVisible}
        okText="??????"
        onOk={() => this.handleModalVisible(false)}
        onCancel={() => this.handleModalVisible(false)}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="??????">
          {form.getFieldDecorator('domainName', {
            initialValue: current.domainName,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="?????????IPv4??????">
          {form.getFieldDecorator('ipv4', {
            initialValue: current.ipv4,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="?????????IPv6??????">
          {form.getFieldDecorator('ipv6', {
            initialValue: current.ipv6,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="????????????">
          {form.getFieldDecorator('ownerAddr', {
            initialValue: current.ownerAddr,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="????????????">
          {form.getFieldDecorator('transFlag', {
            initialValue: current.transFlag,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="????????????">
          {form.getFieldDecorator('timestamp', {
            initialValue: moment(current.timestamp).format('YYYY-MM-DD HH:mm:ss'),
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="????????????">
          {form.getFieldDecorator('confirm', {
            initialValue: current.confirm,
          })(<Input disabled={true} />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="????????????">
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
        title: '??????',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '?????????IPv4??????',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '?????????IPv6??????',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'transFlag',
        align: 'center',
      },
      {
        title: '????????????',
        dataIndex: 'timestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '?????????',
        dataIndex: 'confirm',
        align: 'center',
        render: val => <span>{val.length}</span>,
      },
      {
        title: '??????',
        align: 'center',
        render: (text, record) => (
          <Fragment>
            <a onClick={() => this.showEditModal(record)}>??????</a>
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="????????????">
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
