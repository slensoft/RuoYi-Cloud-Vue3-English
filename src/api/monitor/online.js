import request from '@/utils/request'

// Query online user list
export function list(query) {
  return request({
    url: '/system/online/list',
    method: 'get',
    params: query
  })
}

// Force user logout
export function forceLogout(tokenId) {
  return request({
    url: '/system/online/' + tokenId,
    method: 'delete'
  })
}
