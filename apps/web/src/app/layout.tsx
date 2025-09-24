import './globals.css'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Providers } from './providers'
import { MemoizedHeader as Header } from '@/components/header'
import { Footer } from '@/components/footer'
import ReownProvider from '@/contexts/reown-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TransactProof - Crypto Receipt Generator',
  description: 'Generate PDF receipts for your crypto transactions with USDT payment',
  keywords: ['crypto', 'receipt', 'pdf', 'blockchain', 'base', 'usdt'],
  authors: [{ name: 'TransactProof Team' }],
  creator: 'TransactProof',
  publisher: 'TransactProof',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

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