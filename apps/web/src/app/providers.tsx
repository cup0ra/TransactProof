'use client'

import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/contexts/theme-context'
import { AuthProvider } from '@/contexts/auth-context'
import { WalletAuthProvider } from '@/contexts/wallet-auth-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WalletAuthProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg, #000000)',
              color: 'var(--toast-text, #ffffff)',
              border: 'var(--toast-border, 1px solid #374151)',
              borderRadius: '0px',
              fontSize: '12px',
              fontWeight: '300',
              letterSpacing: '0.025em',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: 'var(--toast-bg, #000000)',
                color: 'var(--toast-text, #ffffff)',
                border: '1px solid #f97316',
              },
              iconTheme: {
                primary: '#f97316',
                secondary: 'var(--toast-bg, #000000)',
              },
            },
            error: {
              style: {
                background: 'var(--toast-bg, #000000)',
                color: 'var(--toast-text, #ffffff)',
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: 'var(--toast-bg, #000000)',
              },
            },
            loading: {
              style: {
                background: 'var(--toast-bg, #000000)',
                color: 'var(--toast-text, #ffffff)',
                border: 'var(--toast-border, 1px solid #6b7280)',
              },
              iconTheme: {
                primary: '#f97316',
                secondary: 'var(--toast-bg, #000000)',
              },
            },
          }}
        />
      </WalletAuthProvider>
    </ThemeProvider>
  )
}