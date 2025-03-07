import request from '@/utils/request'

// Query login log list
export function list(query) {
  return request({
    url: '/system/logininfor/list',
    method: 'get',
    params: query
  })
}

// Delete login log
export function delLogininfor(infoId) {
  return request({
    url: '/system/logininfor/' + infoId,
    method: 'delete'
  })
}

// Unlock user login status
export function unlockLogininfor(userName) {
  return request({
    url: '/system/logininfor/unlock/' + userName,
    method: 'get'
  })
}

// Clear login logs
export function cleanLogininfor() {
  return request({
    url: '/system/logininfor/clean',
    method: 'delete'
  })
}
