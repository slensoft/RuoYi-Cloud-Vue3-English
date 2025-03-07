import request from '@/utils/request'

// Get routes
export const getRouters = () => {
  return request({
    url: '/system/menu/getRouters',
    method: 'get'
  })
}