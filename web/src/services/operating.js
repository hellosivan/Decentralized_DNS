import request from '@/utils/request';

export async function queryData() {
  return request(`/api/dns/domain/queryown`);
}

export async function applyData(data) {
  return request('/api/dns/domain/apply', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}

export async function deleteData(data) {
  return request('/api/dns/domain/delete', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}

export async function updateData(data) {
  return request('/api/dns/domain/update', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}
