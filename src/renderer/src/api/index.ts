import axios from 'axios'

// 请求拦截器
axios.interceptors.request.use(
  (config) => {
    // 可以在这里添加通用的请求头、token等
    // 例如: config.headers['Authorization'] = 'Bearer token'
    return config
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    // 可以在这里统一处理响应数据
    return response
  },
  (error) => {
    // 响应错误处理
    return Promise.reject(error)
  }
)
