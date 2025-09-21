'use client'

import { useState } from 'react'

export default function HelpCenterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-light text-black dark:text-white mb-4 tracking-wide">
          Help Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
          Need help? We&apos;re here to assist you. Send us a message and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="grid gap-6 sm:gap-8">
        <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white tracking-wide">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>How to generate a receipt for crypto transactions?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              Connect your MetaMask wallet, enter the transaction hash, add a description (optional), and pay a small fee in ETH to generate a professional PDF receipt.
            </p>
          </details>

          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>Which networks are supported?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              We support Ethereum, Base, Polygon, Optimism, and Arbitrum networks. Base Sepolia is available for testing.
            </p>
          </details>

          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>How much does receipt generation cost?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              Receipt generation costs 0.0000001 ETH or 0.5 USDT/USDC (depending on your chosen payment method).
            </p>
          </details>

          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>Is the platform secure?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              Yes, we use Sign-In with Ethereum (SIWE) for secure authentication and don't store private keys. All transactions are verified through the blockchain.
            </p>
          </details>

          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>How can I view my previous receipts?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              After connecting your wallet and authenticating, go to the Dashboard section where you can view all your generated receipts.
            </p>
          </details>

          <details className="group border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
            <summary className="cursor-pointer text-sm sm:text-base font-light text-black dark:text-white mb-2 list-none">
              <div className="flex justify-between items-center">
                <span>What to do if transaction is not found?</span>
                <span className="group-open:rotate-45 transition-transform duration-200">+</span>
              </div>
            </summary>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light leading-relaxed">
              Make sure the transaction hash is correct and the transaction is confirmed on the blockchain. Also verify that the transaction was executed on a supported network.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Form */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8 sm:pt-12">
        <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8 tracking-wide">
          Contact Us
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 text-black dark:text-white text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 text-black dark:text-white text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 text-black dark:text-white text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300"
              placeholder="Subject of your message"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-light text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 text-black dark:text-white text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-300 resize-vertical"
              placeholder="Describe your question or issue in detail..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-orange-400 hover:bg-orange-500 disabled:bg-gray-400 text-white dark:text-black font-light text-sm transition-colors duration-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-light">
              Thank you for your message! We'll get back to you as soon as possible.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-light">
              An error occurred while sending your message. Please try again.
            </div>
          )}
        </form>
      </div>

      {/* Contact Information */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8 sm:pt-12">
        <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 tracking-wide">
          Other Ways to Reach Us
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="text-base font-light text-black dark:text-white mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
              support@transactproof.com
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="text-base font-light text-black dark:text-white mb-2">Response Time</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
              We typically respond within 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}