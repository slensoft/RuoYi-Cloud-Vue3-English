import request from '@/utils/request'

// Query operation log list
export function list(query) {
  return request({
    url: '/system/operlog/list',
    method: 'get',
    params: query
  })
}

// Delete operation log
export function delOperlog(operId) {
  return request({
    url: '/system/operlog/' + operId,
    method: 'delete'
  })
}

// Clear operation logs
export function cleanOperlog() {
  return request({
    url: '/system/operlog/clean',
    method: 'delete'
  })
}
