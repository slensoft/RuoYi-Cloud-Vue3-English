import request from '@/utils/request'

// Query scheduled task list
export function listJob(query) {
  return request({
    url: '/schedule/job/list',
    method: 'get',
    params: query
  })
}

// Get scheduled task details
export function getJob(jobId) {
  return request({
    url: '/schedule/job/' + jobId,
    method: 'get'
  })
}

// Add scheduled task
export function addJob(data) {
  return request({
    url: '/schedule/job',
    method: 'post',
    data: data
  })
}

// Update scheduled task
export function updateJob(data) {
  return request({
    url: '/schedule/job',
    method: 'put',
    data: data
  })
}

// Delete scheduled task
export function delJob(jobId) {
  return request({
    url: '/schedule/job/' + jobId,
    method: 'delete'
  })
}

// Modify task status
export function changeJobStatus(jobId, status) {
  const data = {
    jobId,
    status
  }
  return request({
    url: '/schedule/job/changeStatus',
    method: 'put',
    data: data
  })
}


// Execute scheduled task immediately
export function runJob(jobId, jobGroup) {
  const data = {
    jobId,
    jobGroup
  }
  return request({
    url: '/schedule/job/run',
    method: 'put',
    data: data
  })
}