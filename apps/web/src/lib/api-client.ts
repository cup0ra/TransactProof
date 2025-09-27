/**
 * API клиент с автоматической обработкой ошибок аутентификации и refresh token
 */

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  private static isRefreshing = false
  private static refreshPromise: Promise<boolean> | null = null
  
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
      let response = await fetch(fullUrl, defaultOptions)
      
      // Если получили 401, пытаемся обновить токен
      if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/verify')) {
        const refreshed = await this.tryRefreshToken()
        
        if (refreshed) {
          // Повторяем исходный запрос с обновленным токеном
          response = await fetch(fullUrl, defaultOptions)
        } else {
          // Если refresh не удался, перенаправляем на логин
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          throw new Error('Authentication required')
        }
      }
      
      // Проверяем статус после возможного refresh
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('Authentication required')
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
  
  private static async tryRefreshToken(): Promise<boolean> {
    // Если уже идет процесс refresh, ждем его завершения
    if (this.isRefreshing && this.refreshPromise) {
      return await this.refreshPromise
    }
    
    if (this.isRefreshing) {
      return false
    }
    
    this.isRefreshing = true
    this.refreshPromise = this.performRefresh()
    
    try {
      const result = await this.refreshPromise
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }
  
  private static async performRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }
  
  static async get(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'GET' })
  }
  
  static async post(url: string, data?: unknown, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  static async put(url: string, data?: unknown, options: RequestInit = {}) {
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
