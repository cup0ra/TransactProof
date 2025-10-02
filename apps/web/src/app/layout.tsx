import './globals.css'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from './providers'
import { MemoizedHeader as Header } from '@/components/header'
import { Footer } from '@/components/footer'
import ReownProvider from '@/contexts/reown-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TransactProof — Generate Verified Crypto Transaction Receipts (PDF)',
  description:
    'TransactProof lets you instantly create verifiable PDF receipts for your crypto transactions. Pay 1 USDT on supported networks — Ethereum Mainnet, Base, Polygon, Optimism, Arbitrum, zkSync Era, BNB Smart Chain, and Avalanche C-Chain — and receive a tamper-proof document with complete blockchain details.',
  keywords: [
    'crypto receipt generator',
    'blockchain transaction proof',
    'PDF crypto invoice',
    'USDT receipt',
    'Ethereum Mainnet',
    'Base network',
    'Polygon',
    'Optimism',
    'Arbitrum',
    'zkSync Era',
    'BNB Smart Chain',
    'Avalanche C-Chain',
    'crypto tax report',
    'on-chain proof'
  ],
  authors: [{ name: 'TransactProof Team', url: 'https://transactproof.com' }],
  creator: 'TransactProof',
  publisher: 'TransactProof',
  applicationName: 'TransactProof',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    url: 'https://transactproof.com',
    title: 'TransactProof — Verified Crypto Receipts',
    description:
      'Generate tamper-proof PDF receipts for your blockchain transactions with a simple 1 USDT payment on Ethereum, Base, Polygon, Optimism, Arbitrum, zkSync, BNB Smart Chain, and Avalanche.',
    images: [
      {
        url: '/bg-dark.png',
        width: 1200,
        height: 630,
        alt: 'TransactProof Crypto Receipt Generator'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@TransactProof',
    creator: '@TransactProof',
    title: 'TransactProof — Crypto Receipt Generator',
    description:
      'Create verifiable PDF receipts for your crypto transactions with a simple 1 USDT payment on Ethereum, Base, Polygon, Optimism, Arbitrum, zkSync, BNB Smart Chain, and Avalanche.',
    images: ['/bg-dark.png']
  },
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.png',
  },
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('transactproof-theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || 'system';
                  const isDark = theme === 'system' ? systemDark : theme === 'dark';
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })()
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ReownProvider cookies={cookies}>
          <Providers>
            <div className="min-h-screen flex flex-col bg-white dark:bg-black">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </Providers>
        </ReownProvider>
      </body>
    </html>
  )
}