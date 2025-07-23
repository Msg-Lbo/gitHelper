
import request from './request'

// OA 系统相关接口定义

// 项目列表接口
export interface ProjectItem {
  id: string
  name: string
  description?: string
  status: string
  createTime: string
  updateTime: string
}

// 获取我的项目列表
export const getMyProjectList = (): Promise<ProjectItem[]> => {
  return request({
    url: '/oa/backend/project/myProjectList',
    method: 'GET'
  })
}