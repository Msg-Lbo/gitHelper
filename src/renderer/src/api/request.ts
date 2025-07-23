import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getOAToken, getApiBaseUrl } from '../utils/storage'

const BASE_URL = getApiBaseUrl()

// 创建 axios 实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取 localStorage 中的 token
const getToken = (): string | null => {
  return getOAToken()
}

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 在发送请求之前做些什么
    const token = getToken()

    if (token && config.headers) {
      // 添加 Authorization 头部
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log('发送请求:', config.url, config.method?.toUpperCase())
    return config
  },
  (error: AxiosError) => {
    // 对请求错误做些什么
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 2xx 范围内的状态码都会触发该函数
    console.log('响应成功:', response.status, response.config.url)

    // 直接返回响应数据
    return response.data
  },
  (error: AxiosError) => {
    // 超出 2xx 范围的状态码都会触发该函数
    console.error('响应错误:', error.response?.status, error.config?.url)

    // 处理不同的错误状态码
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.error('未授权，请检查 token')
          // 可以在这里清除无效的 token
          // clearToken()
          break
        case 403:
          console.error('禁止访问')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error('请求失败:', error.response.status)
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误:', error.message)
    }

    return Promise.reject(error)
  }
)

// 导出存储工具函数，方便其他模块使用
export { setOAToken as setToken, clearOAToken as clearToken, hasOAToken as hasToken } from '../utils/storage'

export default request
