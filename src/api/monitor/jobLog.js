import request from '@/utils/request'

// Query schedule log list
export function listJobLog(query) {
  return request({
    url: '/schedule/job/log/list',
    method: 'get',
    params: query
  })
}

// Delete schedule log
export function delJobLog(jobLogId) {
  return request({
    url: '/schedule/job/log/' + jobLogId,
    method: 'delete'
  })
}

// Clear schedule logs
export function cleanJobLog() {
  return request({
    url: '/schedule/job/log/clean',
    method: 'delete'
  })
}
