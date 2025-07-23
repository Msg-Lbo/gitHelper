import type { GitHelperSettings } from '../types/api'

// GitHelper 设置的 localStorage key
const SETTINGS_KEY = 'githelper-settings'

/**
 * 获取 GitHelper 设置
 */
export const getSettings = (): GitHelperSettings => {
  try {
    const settings = localStorage.getItem(SETTINGS_KEY)
    return settings ? JSON.parse(settings) : {}
  } catch (error) {
    console.error('获取设置失败:', error)
    return {}
  }
}

/**
 * 保存 GitHelper 设置
 */
export const saveSettings = (settings: Partial<GitHelperSettings>): void => {
  try {
    const currentSettings = getSettings()
    const newSettings = { ...currentSettings, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
  } catch (error) {
    console.error('保存设置失败:', error)
    throw error
  }
}

/**
 * 清除所有设置
 */
export const clearSettings = (): void => {
  try {
    localStorage.removeItem(SETTINGS_KEY)
  } catch (error) {
    console.error('清除设置失败:', error)
    throw error
  }
}

/**
 * 获取 OA Token
 */
export const getOAToken = (): string | null => {
  const settings = getSettings()
  return settings.oaToken || null
}

/**
 * 设置 OA Token
 */
export const setOAToken = (token: string): void => {
  saveSettings({ oaToken: token })
}

/**
 * 清除 OA Token
 */
export const clearOAToken = (): void => {
  const settings = getSettings()
  delete settings.oaToken
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * 检查 Token 是否存在
 */
export const hasOAToken = (): boolean => {
  const token = getOAToken()
  return Boolean(token && token.trim())
}

/**
 * 获取 API 基础 URL
 */
export const getApiBaseUrl = (): string => {
  const settings = getSettings()
  return settings.apiBaseUrl || 'https://ai.mufengweilai.com/api'
}

/**
 * 设置 API 基础 URL
 */
export const setApiBaseUrl = (url: string): void => {
  saveSettings({ apiBaseUrl: url })
}

/**
 * 获取主题设置
 */
export const getTheme = (): 'light' | 'dark' => {
  const settings = getSettings()
  return settings.theme || 'light'
}

/**
 * 设置主题
 */
export const setTheme = (theme: 'light' | 'dark'): void => {
  saveSettings({ theme })
}

/**
 * 获取语言设置
 */
export const getLanguage = (): 'zh-CN' | 'en-US' => {
  const settings = getSettings()
  return settings.language || 'zh-CN'
}

/**
 * 设置语言
 */
export const setLanguage = (language: 'zh-CN' | 'en-US'): void => {
  saveSettings({ language })
}

/**
 * 导出设置（用于备份）
 */
export const exportSettings = (): string => {
  const settings = getSettings()
  return JSON.stringify(settings, null, 2)
}

/**
 * 导入设置（用于恢复）
 */
export const importSettings = (settingsJson: string): void => {
  try {
    const settings = JSON.parse(settingsJson)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('导入设置失败:', error)
    throw new Error('设置格式不正确')
  }
}
