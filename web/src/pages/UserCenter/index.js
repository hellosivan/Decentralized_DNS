import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { Card, Row, Col, Divider, Modal, message, InputNumber, Form } from 'antd';
import styles from './index.less';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import userImg from '../../assets/user.png';
import moment from 'moment';

const FormItem = Form.Item;

@Form.create()
@connect(({ userCenter }) => ({ userCenter }))
class Center extends PureComponent {
  state = {
    modalVisible: false,
    tabTitle: '最新区块',
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'userCenter/queryInfo',
    });
    dispatch({
      type: 'userCenter/queryBlock',
    });
  }

  handleMine = () => {
    const {
      dispatch,
      userCenter: { block },
    } = this.props;
    Modal.confirm({
      title: '打包新区块',
      content: '打包新区块需要进行工作量证明计算，可能需要几秒钟，确定吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        dispatch({
          type: 'userCenter/mine',
        });
        dispatch({
          type: 'userCenter/queryInfo',
        });
        message.success(`正在打包新区块！区块号：${block.index + 1}`);
        this.setState({
          tabTitle: '最新区块',
        });
      },
    });
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: flag,
    });
  };

  showEditModal = () => {
    this.handleModalVisible(true);
  };

  okHandle = () => {
    const { form, dispatch } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      dispatch({
        type: 'userCenter/queryBlock',
        payload: {
          ...fieldsValue,
        },
      });
      message.success('查询成功');
      this.setState({
        tabTitle: '当前区块',
      });
      this.handleModalVisible(false);
    });
  };

  cancelHandle = () => {
    this.handleModalVisible(false);
  };

  renderForm = () => {
    const { modalVisible } = this.state;
    const { form } = this.props;
    return (
      <Modal
        width="430px"
        destroyOnClose
        title="查询区块"
        visible={modalVisible}
        okText="查询"
        onOk={this.okHandle}
        onCancel={this.cancelHandle}
      >
        <FormItem labelCol={{ span: 5 }} wrapperCol={{ span: 16 }} label="区块号">
          {form.getFieldDecorator('blockId', {
            rules: [{ required: true, message: '区块号不能为空！' }],
          })(
            <InputNumber
              min={1}
              style={{ width: '250px', marginLeft: '10px' }}
              placeholder="请输入区块号"
            />
          )}
        </FormItem>
      </Modal>
    );
  };

  render() {
    const {
      listLoading,
      userCenter: { info, block },
    } = this.props;
    const { tabTitle } = this.state;

    const operationTabList = [
      {
        key: 'block',
        tab: <span>区块信息</span>,
      },
    ];

    return (
      <PageHeaderWrapper title="个人中心">
        <Row gutter={24}>
          <Col lg={7} md={24}>
            <Card bordered={false} style={{ marginBottom: 24 }}>
              <div className={styles.avatarHolder}>
                <img alt="" src={userImg} />
                <div className={styles.name}>区块链节点地址</div>
                <div>{info.id}</div>
              </div>
              <div className={styles.detail}>
                <p>
                  <i className={styles.group} />
                  申请域名数： {info.createNum}
                </p>
                <p>
                  <i className={styles.group} />
                  申请转移域名数： {info.applyTransNum}
                </p>
                <p>
                  <i className={styles.group} />
                  确认域名数： {info.confirmNum}
                </p>
                <p>
                  <i className={styles.title} />
                  打包区块数： {info.mineNum}
                </p>
              </div>
              <Divider dashed />
            </Card>
          </Col>
          <Col lg={17} md={24}>
            <Card
              className={styles.tabsCard}
              bordered={false}
              tabList={operationTabList}
              loading={listLoading}
            >
              <Card
                hoverable
                className={styles.card}
                actions={[
                  <a onClick={() => this.handleMine()}>打包新区块</a>,
                  <a onClick={() => this.showEditModal()}>查询区块</a>,
                ]}
              >
                <Card.Meta title={<a>{tabTitle}</a>} style={{ marginBottom: '20px' }} />
                <Row style={{ marginBottom: '15px' }}>
                  <Col span={17}>区块号： {block.index}</Col>
                </Row>
                <Row style={{ marginBottom: '15px' }}>
                  <Col span={17}>打包节点： {block.miner}</Col>
                </Row>
                <Row style={{ marginBottom: '15px' }}>
                  <Col span={17}>打包时间： {moment(block.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Col>
                </Row>
                <Row style={{ marginBottom: '15px' }}>
                  <Col span={17}>工作量证明随机数： {block.proof}</Col>
                </Row>
                <Row style={{ marginBottom: '15px' }}>
                  <Col span={17}>前一个区块哈希值： {block.previous_hash}</Col>
                </Row>
                <div>{this.renderForm()}</div>

              </Card>
            </Card>
          </Col>
        </Row>
      </PageHeaderWrapper>
    );
  }
}

export default Center;
