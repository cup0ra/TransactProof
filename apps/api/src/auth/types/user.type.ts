export interface AuthenticatedUser {
  id: string
  walletAddress: string
  jwtId: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}