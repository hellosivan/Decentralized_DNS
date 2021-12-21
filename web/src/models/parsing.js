import * as domainService from '@/services/parsing';

export default {
  namespace: 'parsing',

  state: {
    data: [],
  },

  effects: {
    * queryData({ payload }, { call, put }) {
      const rsp = yield call(domainService.queryData, payload);
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
}
