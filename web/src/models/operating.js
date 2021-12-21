import * as domainService from '@/services/operating';


export default {
  namespace: 'operating',

  state: {
    data: [],
  },

  effects: {

    *queryData({ payload }, { call, put }) {
      const rsp = yield call(domainService.queryData, payload);
      yield put({
        type: 'saveData',
        payload: rsp,
      });
    },

    *applyOne({ payload }, { call }) {
      const rsp = yield call(domainService.applyData, payload);
      return rsp;
    },

    *updateOne({ payload }, { call, put }) {
      const rsp = yield call(domainService.updateData, payload);
      yield put({
        type: 'saveData',
        payload: rsp,
      });
    },

    *deleteOne({ payload }, { call, put }) {
      const rsp = yield call(domainService.deleteData, payload);
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
  },
};
