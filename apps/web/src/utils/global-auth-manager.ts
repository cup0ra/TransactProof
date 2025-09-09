// Глобальный singleton для предотвращения множественных аутентификаций
class GlobalAuthManager {
  private static instance: GlobalAuthManager | null = null
  private authPromises: Map<string, Promise<any>> = new Map()
  private authenticatedAddresses: Set<string> = new Set()
  private authCallbacks: Set<(address: string, isAuthenticated: boolean) => void> = new Set()

  static getInstance(): GlobalAuthManager {
    if (!GlobalAuthManager.instance) {
      GlobalAuthManager.instance = new GlobalAuthManager()
    }
    return GlobalAuthManager.instance
  }

  // Подписываемся на изменения аутентификации
  onAuthChange(callback: (address: string, isAuthenticated: boolean) => void): () => void {
    this.authCallbacks.add(callback)
    return () => {
      this.authCallbacks.delete(callback)
    }
  }

  // Уведомляем о изменениях
  private notifyAuthChange(address: string, isAuthenticated: boolean): void {
    this.authCallbacks.forEach(callback => {
      try {
        callback(address, isAuthenticated)
      } catch (error) {
        console.error('Error in auth callback:', error)
      }
    })
  }

  // Проверяем, аутентифицирован ли адрес
  isAuthenticated(address: string): boolean {
    return this.authenticatedAddresses.has(address.toLowerCase())
  }

  // Отмечаем адрес как аутентифицированный
  markAuthenticated(address: string): void {
    const normalizedAddress = address.toLowerCase()
    if (!this.authenticatedAddresses.has(normalizedAddress)) {
      this.authenticatedAddresses.add(normalizedAddress)
      this.notifyAuthChange(normalizedAddress, true)
    }
  }

  // Убираем адрес из аутентифицированных
  markUnauthenticated(address: string): void {
    const normalizedAddress = address.toLowerCase()
    if (this.authenticatedAddresses.has(normalizedAddress)) {
      this.authenticatedAddresses.delete(normalizedAddress)
      this.notifyAuthChange(normalizedAddress, false)
    }
  }

  // Очищаем все аутентификации
  clearAll(): void {
    const addresses = Array.from(this.authenticatedAddresses)
    this.authenticatedAddresses.clear()
    this.authPromises.clear()
    
    // Уведомляем об очистке всех адресов
    addresses.forEach(address => {
      this.notifyAuthChange(address, false)
    })
  }

  // Очищаем конкретный адрес
  clearAddress(address: string): void {
    const normalizedAddress = address.toLowerCase()
    this.authenticatedAddresses.delete(normalizedAddress)
    this.authPromises.delete(normalizedAddress)
    this.notifyAuthChange(normalizedAddress, false)
  }

  // Получаем или создаем промис аутентификации для адреса
  async getOrCreateAuthPromise(
    address: string,
    authFunction: () => Promise<any>
  ): Promise<any> {
    const normalizedAddress = address.toLowerCase()
    
    // Если уже аутентифицирован - возвращаем resolved промис
    if (this.isAuthenticated(normalizedAddress)) {
      return Promise.resolve()
    }

    // Если уже идет аутентификация для этого адреса - возвращаем существующий промис
    if (this.authPromises.has(normalizedAddress)) {
      return this.authPromises.get(normalizedAddress)!
    }

    // Создаем новый промис аутентификации
    const authPromise = authFunction()
      .then((result) => {
        this.markAuthenticated(normalizedAddress)
        this.authPromises.delete(normalizedAddress)
        return result
      })
      .catch((error) => {
        this.authPromises.delete(normalizedAddress)
        throw error
      })

    this.authPromises.set(normalizedAddress, authPromise)
    return authPromise
  }
}

export const globalAuthManager = GlobalAuthManager.getInstance()