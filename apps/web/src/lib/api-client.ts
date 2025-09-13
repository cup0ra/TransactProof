/**
 * API клиент с автоматической обработкой ошибок аутентификации
 */

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  static async fetch(url: string, options: RequestInit = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(fullUrl, defaultOptions)
      
      // Если получили 401, просто возвращаем ошибку без автоматического редиректа
      // Пусть компоненты сами решают как обрабатывать ошибки аутентификации
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }))
        throw new Error(errorData.message || 'Authentication required')
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error) {
      throw error
    }
  }
  
  static async get(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'GET' })
  }
  
  static async post(url: string, data?: any, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  static async put(url: string, data?: any, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  static async delete(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' })
  }
}
