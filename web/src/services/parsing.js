import request from '@/utils/request';

export async function queryData(data) {
  let domainName = '';
  let ipv4 = '';
  let ipv6 = '';
  if (data) {
    domainName = data.searchDomainName ? data.searchDomainName : '';
    ipv4 = data.searchIpv4 ? data.searchIpv4 : '';
    ipv6 = data.searchIpv6 ? data.searchIpv6 : '';
  }
  return request(`/api/dns/domain/queryall?domainName=${domainName}&ipv4=${ipv4}&ipv6=${ipv6}`);
}





