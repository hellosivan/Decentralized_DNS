import * as transService from '@/services/transfering';

export default {
  namespace: 'transfering',

  state: {
    dataApply: [],
    dataApplied: [],
    info: [],
  },

  effects: {

    *queryDataApply({ payload }, { call, put }) {
      const rsp = yield call(transService.queryDataApply, payload);
      yield put({
        type: 'saveDataApply',
        payload: rsp,
      });
    },

    *queryDataApplied({ payload }, { call, put }) {
      const rsp = yield call(transService.queryDataApplied, payload);
      yield put({
        type: 'saveDataApplied',
        payload: rsp,
      });
    },

    *queryInfo({ payload }, { call, put }) {
      const rsp = yield call(transService.queryInfo, payload);
      yield put({
        type: 'saveInfo',
        payload: rsp,
      });
    },

    *applyTrans({ payload }, { call, put }) {
      const rsp = yield call(transService.applyTrans, payload);
      yield put({
        type: 'saveDataApply',
        payload: rsp,
      });
      return rsp;
    },

    *confirmTrans({ payload }, { call, put }) {
      const rsp = yield call(transService.confirmTrans, payload);
      yield put({
        type: 'saveDataApplied',
        payload: rsp,
      });
    },
  },

  reducers: {
    saveDataApply(state, action) {
      return {
        ...state,
        dataApply: action.payload,
      };
    },
    saveDataApplied(state, action) {
      return {
        ...state,
        dataApplied: action.payload,
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
