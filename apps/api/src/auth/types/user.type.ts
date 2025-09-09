export interface AuthenticatedUser {
  id: string
  walletAddress: string
  jwtId: string
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}