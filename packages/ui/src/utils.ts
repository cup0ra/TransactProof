import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatAmount = (amount: string | number, decimals: number = 6): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(decimals)
}