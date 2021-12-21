import * as confirmService from '@/services/confirm';

export default {
  namespace: 'confirm',

  state: {
    data: [],
    info: [],
  },

  effects: {
    *queryData({ payload }, { call, put }) {
      const rsp = yield call(confirmService.queryData, payload);
      yield put({
        type: 'saveData',
        payload: rsp,
      });
    },
    *queryInfo({ payload }, { call, put }) {
      const rsp = yield call(confirmService.queryInfo, payload);
      yield put({
        type: 'saveInfo',
        payload: rsp,
      });
    },
    *confirmOne({ payload }, { call, put }) {
      const rsp = yield call(confirmService.confirm, payload);
      yield put({
        type: 'saveData',
        payload: rsp,
      });
    },
  },

  reducers: {
    saveData(state, action) {
      return {
        ...state,
        data: action.payload,
      };
    },
    saveInfo(state, action) {
      return {
        ...state,
        info: action.payload,
      };
    },
  },
};
