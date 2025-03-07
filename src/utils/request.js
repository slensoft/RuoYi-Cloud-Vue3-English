import axios from 'axios'
import { ElNotification , ElMessageBox, ElMessage, ElLoading } from 'element-plus'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams, blobValidate } from '@/utils/ruoyi'
import cache from '@/plugins/cache'
import { saveAs } from 'file-saver'
import useUserStore from '@/store/modules/user'

let downloadLoadingInstance;
// Show re-login dialog
export let isRelogin = { show: false };

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
// Create axios instance
const service = axios.create({
  // baseURL option in axios config represents the common part of request URL
  baseURL: import.meta.env.VITE_APP_BASE_API,
  // Timeout
  timeout: 10000
})

// Request interceptor
service.interceptors.request.use(config => {
  // Whether token needs to be set
  const isToken = (config.headers || {}).isToken === false
  // Whether to prevent duplicate data submission
  const isRepeatSubmit = (config.headers || {}).repeatSubmit === false
  if (getToken() && !isToken) {
    config.headers['Authorization'] = 'Bearer ' + getToken() // Add custom token to each request, modify according to actual situation
  }
  // Map params for GET request
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime()
    }
    const requestSize = Object.keys(JSON.stringify(requestObj)).length; // Request data size
    const limitSize = 5 * 1024 * 1024; // Limit data storage to 5M
    if (requestSize >= limitSize) {
      console.warn(`[${config.url}]: ` + 'Request data size exceeds the allowed 5M limit, unable to perform duplicate submission validation.')
      return config;
    }
    const sessionObj = cache.session.getJSON('sessionObj')
    if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj)
    } else {
      const s_url = sessionObj.url;                // Request URL
      const s_data = sessionObj.data;              // Request data
      const s_time = sessionObj.time;              // Request time
      const interval = 1000;                       // Interval (ms), requests within this time are considered duplicate submissions
      if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
        const message = 'Data is being processed, please do not submit repeatedly';
        console.warn(`[${s_url}]: ` + message)
        return Promise.reject(new Error(message))
      } else {
        cache.session.setJSON('sessionObj', requestObj)
      }
    }
  }
  return config
}, error => {
    console.log(error)
    Promise.reject(error)
})

// Response interceptor
service.interceptors.response.use(res => {
    // Default success status if status code is not set
    const code = res.data.code || 200;
    // Get error message
    const msg = errorCode[code] || res.data.msg || errorCode['default']
    // Return binary data directly
    if (res.request.responseType ===  'blob' || res.request.responseType ===  'arraybuffer') {
      return res.data
    }
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        ElMessageBox.confirm('Login status has expired, you can continue to stay on this page or log in again', 'System Prompt', { confirmButtonText: 'Re-login', cancelButtonText: 'Cancel', type: 'warning' }).then(() => {
          isRelogin.show = false;
          useUserStore().logOut().then(() => {
            location.href = '/index';
          })
      }).catch(() => {
        isRelogin.show = false;
      });
    }
      return Promise.reject('Invalid session, or the session has expired, please log in again.')
    } else if (code === 500) {
      ElMessage({ message: msg, type: 'error' })
      return Promise.reject(new Error(msg))
    } else if (code === 601) {
      ElMessage({ message: msg, type: 'warning' })
      return Promise.reject(new Error(msg))
    } else if (code !== 200) {
      ElNotification.error({ title: msg })
      return Promise.reject('error')
    } else {
      return  Promise.resolve(res.data)
    }
  },
  error => {
    console.log('err' + error)
    let { message } = error;
    if (message == "Network Error") {
      message = "Backend API connection error";
    } else if (message.includes("timeout")) {
      message = "System interface request timeout";
    } else if (message.includes("Request failed with status code")) {
      message = "System interface " + message.substr(message.length - 3) + " error";
    }
    ElMessage({ message: message, type: 'error', duration: 5 * 1000 })
    return Promise.reject(error)
  }
)

// General download method
export function download(url, params, filename, config) {
  downloadLoadingInstance = ElLoading.service({ text: "Downloading data, please wait", background: "rgba(0, 0, 0, 0.7)", })
  return service.post(url, params, {
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config
  }).then(async (data) => {
    const isBlob = blobValidate(data);
    if (isBlob) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    } else {
      const resText = await data.text();
      const rspObj = JSON.parse(resText);
      const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
      ElMessage.error(errMsg);
    }
    downloadLoadingInstance.close();
  }).catch((r) => {
    console.error(r)
    ElMessage.error('Error downloading file, please contact administrator!')
    downloadLoadingInstance.close();
  })
}

export default service
