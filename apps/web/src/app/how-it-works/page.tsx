import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-yellow-600 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">How TransactProof Works</h1>
          <p className="text-lg sm:text-xl text-orange-100 max-w-2xl mx-auto">
            Generate professional PDF receipts for your USDT transactions on Base network in just a few simple steps.
          </p>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">1</span>
                </div>
                <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gray-700"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Connect Your Wallet</h3>
              <p className="text-sm sm:text-base text-gray-400 px-4 sm:px-0">
                Connect your Ethereum wallet (MetaMask, WalletConnect, etc.) to sign in securely using Sign-In with Ethereum (SIWE).
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">2</span>
                </div>
                <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gray-700"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Enter Transaction Hash</h3>
              <p className="text-sm sm:text-base text-gray-400 px-4 sm:px-0">
                Paste your USDT transaction hash from Base network. We'll automatically verify the transaction and extract all the details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Get Your Receipt</h3>
              <p className="text-sm sm:text-base text-gray-400 px-4 sm:px-0">
                Pay 1 USDT to generate a professional PDF receipt with QR code verification. Download instantly or access anytime from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-800 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">What Makes Our Receipts Special</h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
              Our receipts are more than just PDFs - they're verifiable proof of your blockchain transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Blockchain Verified</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Every receipt is verified against the actual blockchain transaction, ensuring authenticity and accuracy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">QR Code Security</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Each receipt includes a unique QR code that links back to the original transaction for easy verification.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Professional Format</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Clean, professional PDF format suitable for accounting, tax purposes, and business documentation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Instant Generation</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Receipts are generated instantly after payment confirmation. No waiting, no delays.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Permanent Storage</h3>
              <p className="text-sm sm:text-base text-gray-400">
                All your receipts are safely stored and accessible anytime from your personal dashboard.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Multi-Chain Support</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Built for all major EVM networks including Ethereum, Base, Polygon, Optimism, Arbitrum, zkSync Era, BNB Chain, and Avalanche.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Technical Details</h2>
            <p className="text-sm sm:text-base text-gray-400 px-4 sm:px-0">
              Understand the technology behind TransactProof and how we ensure security and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Blockchain Integration */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Blockchain Integration</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Direct integration with Base network RPC</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Real-time transaction verification using Alchemy</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">USDT contract address validation</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Transaction status and confirmation checks</span>
                </li>
              </ul>
            </div>

            {/* Security Features */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Security Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Sign-In with Ethereum (EIP-4361) authentication</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">JWT-based session management</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Secure nonce-based message signing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">End-to-end encryption for data transmission</span>
                </li>
              </ul>
            </div>

            {/* PDF Generation */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">PDF Generation</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">High-quality PDF generation using Puppeteer</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Dynamic QR code generation for verification</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Professional formatting and layout</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Optimized for print and digital viewing</span>
                </li>
              </ul>
            </div>

            {/* Data Storage */}
            <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Data Storage</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">PostgreSQL database for reliable storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Encrypted storage of sensitive information</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Regular backups and data redundancy</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">GDPR-compliant data handling</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-orange-500 to-yellow-600 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">Ready to Generate Your First Receipt?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-orange-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
            Connect your wallet and start creating professional receipts for your USDT transactions today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/"
              className="bg-white text-gray-900 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
            >
              Generate Receipt
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}