import { z } from 'zod'

// Base Chain Configuration
export const BASE_CHAIN_ID = 8453
export const USDT_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Validation Schemas
export const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
export const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

// Types
export interface TransactionDetails {
  sender: string
  receiver: string
  amount: string
  token: string
  timestamp: Date
  blockNumber: number
}

export interface ReceiptData {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount: string
  token: string
  chainId: number
  pdfUrl: string
  description?: string
  createdAt: string
}

export interface User {
  id: string
  walletAddress: string
  createdAt: string
}

export interface AuthResponse {
  walletAddress: string
  expiresAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Validation Utilities
export const validateTxHash = (hash: string): boolean => {
  return txHashSchema.safeParse(hash).success
}

export const validateAddress = (address: string): boolean => {
  return addressSchema.safeParse(address).success
}

// Format Utilities
export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatAmount = (amount: string | number, decimals: number = 6): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(decimals)
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}