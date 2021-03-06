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
              message.success('????????????????????????????????????????????????????????????????????????');
        }
        if (transApplyResult === -1) {
              message.error('??????????????????????????????????????????????????????????????????????????????');
        }
        if (transApplyResult === 0) {
              message.error('???????????????????????????????????????????????????????????????');
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
        title="??????????????????"
        visible={modalTransApplyVisible}
        okText="????????????"
        onOk={okHandle}
        onCancel={() => this.setModalTransApplyVisible(false)}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="?????????????????????">
          {form.getFieldDecorator('transDomainName', {
            rules: [{ required: true, message: '?????????????????????' }],
          })(<Input placeholder="??????????????????????????????" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="?????????IPv4??????">
          {form.getFieldDecorator('transIpv4', {
            rules: [{ required: true, message: '?????????IPv4?????????????????????' }],
          })(<Input placeholder="???????????????????????????IPv4??????" />)}
        </FormItem>
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="?????????IPv6??????">
          {form.getFieldDecorator('transIpv6', {
            rules: [{ required: true, message: '?????????IPv6?????????????????????' }],
          })(<Input placeholder="???????????????????????????IPv6??????" />)}
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
      title: '??????????????????',
      content: '??????????????????????????????',
      okText: '??????',
      cancelText: '??????',
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
        title: '??????',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '???????????????IPv4??????',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '???????????????IPv6??????',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '??????????????????IPv4??????',
        dataIndex: 'transIpv4',
        align: 'center',
      },
      {
        title: '??????????????????IPv6??????',
        dataIndex: 'transIpv6',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'transAddr',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'transTimestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '????????????',
        dataIndex: 'confirm',
        align: 'center',
        render: (text, Item) => (
          <Fragment>
            {Item.confirm.includes(Item.ownerAddr) ? (
              <span>???????????????</span>
            ) : (
              <span>?????????</span>
            )}
          </Fragment>
        ),
      },
    ];

    const columnsApplied = [
      {
        title: '??????',
        dataIndex: 'domainName',
        align: 'center',
      },
      {
        title: '???????????????IPv4??????',
        dataIndex: 'ipv4',
        align: 'center',
      },
      {
        title: '???????????????IPv6??????',
        dataIndex: 'ipv6',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'ownerAddr',
        align: 'center',
      },
      {
        title: '??????????????????IPv4??????',
        dataIndex: 'transIpv4',
        align: 'center',
      },
      {
        title: '??????????????????IPv6??????',
        dataIndex: 'transIpv6',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'transAddr',
        align: 'center',
      },
      {
        title: '??????????????????',
        dataIndex: 'transTimestamp',
        align: 'center',
        render: val => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
      },
      {
        title: '??????',
        align: 'center',
        render: (text, Item) => (
          <Fragment>
            {Item.confirm.includes(id) ? (
              <span>?????????</span>
            ) : (
              <a onClick={() => this.handleConfirmTrans(Item, id)}>??????</a>
            )}
          </Fragment>
        ),
      },
    ];

    return (
      <PageHeaderWrapper title="????????????">
        <Card bordered={false}>
          <Button icon="plus" type="primary" onClick={() => this.setModalTransApplyVisible(true)}>
            ??????????????????
          </Button>
          <div>{this.domainTransApply()}</div>
          <p></p>
          <Card type="inner" title="???????????????????????????">
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
          <Card type="inner" title="?????????????????????????????????">
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
