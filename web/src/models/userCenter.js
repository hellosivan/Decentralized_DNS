import * as blockService from '@/services/userCenter';

export default {
  namespace: 'userCenter',

  state: {
    info: [],
    block: [],
  },

  effects: {
    *queryInfo({ payload }, { call, put }) {
      const rsp = yield call(blockService.queryInfo, payload);
      yield put({
        type: 'saveData',
        payload: rsp,
      });
    },
    *queryBlock({ payload }, { call, put }) {
      const rsp = yield call(blockService.queryBlock, payload);
      yield put({
        type: 'saveBlock',
        payload: rsp,
      });
    },
    *mine({ payload }, { call, put }) {
      const rsp = yield call(blockService.mine, payload);
      yield put({
        type: 'saveBlock',
        payload: rsp,
      });
    },
  },

  reducers: {
    saveData(state, action) {
      return {
        ...state,
        info: action.payload,
      };
    },
    saveBlock(state, action) {
      return {
        ...state,
        block: action.payload,
      };
    },
  },
};
