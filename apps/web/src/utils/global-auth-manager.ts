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

  onAuthChange(callback: (address: string, isAuthenticated: boolean) => void): () => void {
    this.authCallbacks.add(callback)
    return () => {
      this.authCallbacks.delete(callback)
    }
  }

  private notifyAuthChange(address: string, isAuthenticated: boolean): void {
    this.authCallbacks.forEach(callback => {
      try {
        callback(address, isAuthenticated)
      } catch (error) {
        // Silent error handling
      }
    })
  }

  isAuthenticated(address: string): boolean {
    return this.authenticatedAddresses.has(address.toLowerCase())
  }

  markAuthenticated(address: string): void {
    const normalizedAddress = address.toLowerCase()
    if (!this.authenticatedAddresses.has(normalizedAddress)) {
      this.authenticatedAddresses.add(normalizedAddress)
      this.notifyAuthChange(normalizedAddress, true)
    }
  }

  markUnauthenticated(address: string): void {
    const normalizedAddress = address.toLowerCase()
    if (this.authenticatedAddresses.has(normalizedAddress)) {
      this.authenticatedAddresses.delete(normalizedAddress)
      this.notifyAuthChange(normalizedAddress, false)
    }
  }

  clearAll(): void {
    const addresses = Array.from(this.authenticatedAddresses)
    this.authenticatedAddresses.clear()
    this.authPromises.clear()
    
    addresses.forEach(address => {
      this.notifyAuthChange(address, false)
    })
  }

  clearAddress(address: string): void {
    const normalizedAddress = address.toLowerCase()
    this.authenticatedAddresses.delete(normalizedAddress)
    this.authPromises.delete(normalizedAddress)
    this.notifyAuthChange(normalizedAddress, false)
  }

  async getOrCreateAuthPromise(
    address: string,
    authFunction: () => Promise<any>
  ): Promise<any> {
    const normalizedAddress = address.toLowerCase()
    
    if (this.isAuthenticated(normalizedAddress)) {
      return Promise.resolve()
    }

    if (this.authPromises.has(normalizedAddress)) {
      return this.authPromises.get(normalizedAddress)!
    }

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