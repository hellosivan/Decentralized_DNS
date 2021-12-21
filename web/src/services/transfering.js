import request from '@/utils/request';

export async function queryDataApply() {
  return request(`/api/dns/trans/apply`);
}

export async function queryDataApplied() {
  return request(`/api/dns/trans/applied`);
}

export async function queryInfo() {
  return request(`/api/dns/queryInfo`);
}

export async function applyTrans(data) {
  return request('/api/dns/trans/transfer', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}

export async function confirmTrans(data) {
  console.log(data)
  return request('/api/dns/trans/confirm', {
    method: 'POST',
    body: {
      ...data,
    },
  });
}

