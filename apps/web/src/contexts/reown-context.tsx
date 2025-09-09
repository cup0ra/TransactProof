'use client'

import { createAppKit } from '@reown/appkit/react'
import { wagmiAdapter, projectId, networks } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { mainnet, base, baseSepolia, polygon, arbitrum, optimism } from '@reown/appkit/networks'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId || projectId === 'your-project-id-here') {
  console.warn('WalletConnect Project ID not properly configured')
}

// Функция для исправления z-index модального окна
const fixModalZIndex = () => {
  if (typeof window !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = `
      w3m-modal,
      w3m-router,
      appkit-modal,
      [data-testid="w3m-modal"],
      [data-testid="appkit-modal"],
      wui-overlay {
        z-index: 99999 !important;
        position: fixed !important;
        display: block !important;
        visibility: visible !important;
      }
      
      w3m-modal > *,
      w3m-router > *,
      appkit-modal > * {
        z-index: 99999 !important;
        font-family: 'Inter', system-ui, sans-serif !important;
      }
    `
    document.head.appendChild(style)
  }
}

// Set up metadata
const metadata = {
  name: 'TransactProof',
  description: 'Generate PDF receipts for crypto transactions',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Создаем AppKit с правильной конфигурацией
let appKit: any = null

try {  
  appKit = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [mainnet, base, baseSepolia, polygon, arbitrum, optimism],
    defaultNetwork: baseSepolia,
    metadata,
    features: {
      analytics: false,
      email: false,
      socials: false,
      allWallets: true
    },
    themeMode: 'dark',
    enableWalletConnect: true,
    enableInjected: true,
    enableEIP6963: true,
    enableCoinbase: true,
    themeVariables: {
      '--w3m-z-index': 99999,
      '--w3m-font-family': "'Inter', system-ui, sans-serif",
      '--w3m-border-radius-master': '0',
    }
  })

  
  // Принудительно создаем модальное окно в DOM
  if (typeof window !== 'undefined') {
    // Ждем полной инициализации
    setTimeout(() => {
            // Проверяем наличие модального элемента
      let modal = document.querySelector('w3m-modal, appkit-modal')
      if (!modal) {
        modal = document.createElement('w3m-modal')
        document.body.appendChild(modal)
      }
    }, 1000)
  }
  
  fixModalZIndex()
} catch (error) {
  console.error('AppKit initialization failed:', error)
  throw error
}

export function ReownProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  useEffect(() => {
    fixModalZIndex()
    
    const observer = new MutationObserver(() => {
      const modals = document.querySelectorAll('w3m-modal, w3m-router, [data-testid="w3m-modal"]')
      modals.forEach(modal => {
        if (modal instanceof HTMLElement) {
          modal.style.zIndex = '99999'
          modal.style.position = 'fixed'
        }
      })
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ReownProvider