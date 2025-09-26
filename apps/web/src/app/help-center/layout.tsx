import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center - TransactProof',
  description: 'Get help with TransactProof. Find answers to frequently asked questions and contact our support team for assistance.',
  keywords: ['help', 'support', 'FAQ', 'contact', 'TransactProof', 'crypto receipts', 'assistance'],
}

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-16">
        {children}
      </div>
    </div>
  )
}