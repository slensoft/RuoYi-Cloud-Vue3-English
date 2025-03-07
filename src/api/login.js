import request from '@/utils/request'

// Login method
export function login(username, password, code, uuid) {
  return request({
    url: '/auth/login',
    headers: {
      isToken: false,
      repeatSubmit: false
    },
    method: 'post',
    data: { username, password, code, uuid }
  })
}

// Register method
export function register(data) {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// Refresh method
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// Get user details
export function getInfo() {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  })
}

// Logout method
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'delete'
  })
}

// Get verification code
export function getCodeImg() {
  return request({
    url: '/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}