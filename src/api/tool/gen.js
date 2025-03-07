import request from '@/utils/request'

// Query generated table data
export function listTable(query) {
  return request({
    url: '/code/gen/list',
    method: 'get',
    params: query
  })
}

// Query database list
export function listDbTable(query) {
  return request({
    url: '/code/gen/db/list',
    method: 'get',
    params: query
  })
}

// Get table details
export function getGenTable(tableId) {
  return request({
    url: '/code/gen/' + tableId,
    method: 'get'
  })
}

// Update code generation information
export function updateGenTable(data) {
  return request({
    url: '/code/gen',
    method: 'put',
    data: data
  })
}

// Import table
export function importTable(data) {
  return request({
    url: '/code/gen/importTable',
    method: 'post',
    params: data
  })
}

// Preview generated code
export function previewTable(tableId) {
  return request({
    url: '/code/gen/preview/' + tableId,
    method: 'get'
  })
}

// Delete table data
export function delTable(tableId) {
  return request({
    url: '/code/gen/' + tableId,
    method: 'delete'
  })
}

// Generate code (custom path)
export function genCode(tableName) {
  return request({
    url: '/code/gen/genCode/' + tableName,
    method: 'get'
  })
}

// Synchronize database
export function synchDb(tableName) {
  return request({
    url: '/code/gen/synchDb/' + tableName,
    method: 'get'
  })
}
