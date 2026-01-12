import './globals.css'
import { Inter } from 'next/font/google'
import { headers, cookies } from 'next/headers'
import { Providers } from './providers'
import { MemoizedHeader as Header } from '@/components/header'
import { Footer } from '@/components/footer'
import ReownProvider from '@/contexts/reown-context'
import { PAYMENT_AMOUNT_WITHDISCOUNT } from '@/config'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata = {
  title: 'TransactProof — Generate Verified Crypto Transaction Receipts (PDF)',
  description:
    `TransactProof lets you instantly create verifiable PDF receipts for your crypto transactions. Pay ${PAYMENT_AMOUNT_WITHDISCOUNT} USDT on supported networks — Ethereum Mainnet, Base, Polygon, Optimism, Arbitrum, zkSync Era, BNB Smart Chain, and Avalanche C-Chain — and receive a tamper-proof document with complete blockchain details.`,
  keywords: [
    'crypto transaction receipt',
    'crypto receipt pdf',
    'crypto receipt generator',
    'blockchain transaction receipt',
    'blockchain payment proof',
    'on-chain transaction proof',
    'usdt transaction receipt',
    'usdt payment receipt',
    'usdt transfer receipt',
    'crypto invoice pdf'
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
      `Generate tamper-proof PDF receipts for your blockchain transactions with a simple ${PAYMENT_AMOUNT_WITHDISCOUNT} USDT payment on Ethereum, Base, Polygon, Optimism, Arbitrum, zkSync, BNB Smart Chain, and Avalanche.`,
    images: [
      {
        url: '/bg-dark.webp',
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
      `Create verifiable PDF receipts for your crypto transactions with a simple ${PAYMENT_AMOUNT_WITHDISCOUNT} USDT payment on Ethereum, Base, Polygon, Optimism, Arbitrum, zkSync, BNB Smart Chain, and Avalanche.`,
    images: ['/bg-dark.webp']
  },
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.png',
  },
  metadataBase: new URL('https://transactproof.com'),
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersObj = await headers()
  const cookieStore = cookies()
  const rawTheme = cookieStore.get('theme')?.value as string | undefined
  const normalizedTheme = (rawTheme === 'dark' || rawTheme === 'light' || rawTheme === 'system') ? rawTheme : 'system'
  // Server can't know user system preference reliably; assume dark as safer for your branding when system is chosen.
  const initialIsDark = normalizedTheme === 'dark' || (normalizedTheme === 'system')

  return (
    <html lang="en" className={`${inter.className} ${initialIsDark ? 'dark' : ''}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://pulse.walletconnect.org" />
        <link rel="preconnect" href="https://api.transactproof.com" />
        <link rel="preconnect" href="https://api.web3modal.org" />
        {/* Fallback script: adjusts if user stored light but server assumed dark, or vice versa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var t=localStorage.getItem('transactproof-theme')||'system',m=window.matchMedia('(prefers-color-scheme: dark)').matches,d=t==='system'?m:(t==='dark');var de=document.documentElement;if(d){de.classList.add('dark');de.style.colorScheme='dark'}else{de.classList.remove('dark');de.style.colorScheme='light'}}catch(e){}}();`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ReownProvider cookies={headersObj.get('cookie')}>
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