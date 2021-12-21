import request from '@/utils/request';

export async function queryData() {
  return request(`/api/dns/confirm/query`);
}

export async function queryInfo() {
  return request(`/api/dns/queryInfo`);
}

export async function confirm(data) {
  return request('/api/dns/confirm/confirm', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}
