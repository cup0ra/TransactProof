'use client'
import Link from 'next/link'
import { APP_CONFIG, formatPaymentAmount } from '@/config'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 sm:space-x-6 mb-8 sm:mb-12 lg:mb-16">
            <Link href="/" className="text-gray-600 dark:text-gray-400 p-2 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl sm:text-2xl font-light text-black dark:text-white tracking-wide">Terms of Service</h1>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="border border-gray-300 dark:border-gray-800 p-6 sm:p-8 lg:p-12 bg-white dark:bg-black">
              
              {/* Last Updated */}
              <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                  <strong>Last updated:</strong> September 2025
                </p>
              </div>

              {/* Section 1 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">1. Acceptance of Terms</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    By accessing or using TransactProof ("we", "our", "us"), you agree to be bound by these Terms of Service. 
                    If you do not agree, do not use our services.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">2. Our Service</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>TransactProof provides a platform to generate PDF receipts for blockchain transactions.</p>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                    <div className="space-y-2">
                      <p className="text-yellow-800 dark:text-yellow-200 font-normal">
                        • We do not provide financial, investment, or tax advice.
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200 font-normal">
                        • Generated receipts are informational only and may not meet all local regulatory or tax requirements.
                      </p>
                      <p className="text-yellow-800 dark:text-yellow-200 font-normal">
                        • You remain solely responsible for your compliance with applicable laws.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">3. Eligibility</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    You must be at least 18 years old to use our services. By using TransactProof, you confirm that you meet this requirement.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">4. Wallet Access and Payments</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>We never request or store your private keys.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>You authorize transactions from your wallet when you use our services (e.g., payment of {formatPaymentAmount(APP_CONFIG.PAYMENT_AMOUNT)} ETH to generate a receipt).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Once confirmed on the blockchain, transactions are irreversible. Refunds are not possible.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">5. User Responsibilities</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>By using TransactProof, you agree:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>To use the service only for lawful purposes.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Not to attempt unauthorized access to our systems.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Not to misuse generated receipts for fraud, misrepresentation, or illegal activities.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">6. Data and Privacy</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    Your use of TransactProof is also governed by our{' '}
                    <Link href="/privacy" className="text-orange-400 hover:text-orange-300 underline">
                      Privacy Policy
                    </Link>.
                  </p>
                  <p>
                    We process minimal data (wallet address, transaction details, receipts) and never store sensitive wallet credentials.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">7. Intellectual Property</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>All content, branding, and software provided by TransactProof are our property.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>You are granted a limited, non-exclusive license to use the service.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>You may not copy, modify, or resell our platform without written consent.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">8. Disclaimer of Warranties</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                    <div className="space-y-2">
                      <p className="text-red-800 dark:text-red-200 font-normal">
                        • TransactProof is provided "as is" and "as available".
                      </p>
                      <p className="text-red-800 dark:text-red-200 font-normal">
                        • We make no guarantees regarding availability, accuracy, or suitability for specific purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 9 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">9. Limitation of Liability</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>To the maximum extent permitted by law:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>We are not liable for any indirect, incidental, or consequential damages.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>We are not responsible for losses due to blockchain network failures, wallet issues, or user mistakes (e.g., sending to the wrong address).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Our maximum liability is limited to the amount you paid for the service in the past 12 months.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 10 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">10. Termination</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>We may suspend or terminate your access if you:</p>
                  <ul className="space-y-3 mb-4">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Violate these Terms,</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Engage in fraudulent or unlawful activity,</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Abuse or attempt to hack the service.</span>
                    </li>
                  </ul>
                  <p>You may stop using the service at any time.</p>
                </div>
              </section>

              {/* Section 11 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">11. Changes to Terms</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    We may update these Terms from time to time. Continued use of TransactProof after updates means you accept the new terms.
                  </p>
                </div>
              </section>

              {/* Section 12 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">12. Governing Law</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    These Terms are governed by the laws of the applicable jurisdiction where TransactProof operates.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">13. Contact Us</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>For questions about these Terms, contact us at:</p>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <span className="text-orange-400 mr-2">📧</span>
                      <span>Email: </span>
                      <a 
                        href="mailto:support@transactproof.com" 
                        className="text-orange-400 hover:text-orange-300 underline transition-colors duration-300 ml-1"
                      >
                        support@transactproof.com
                      </a>
                    </p>
                    <p className="flex items-center">
                      <span className="text-orange-400 mr-2">🌐</span>
                      <span>Website: </span>
                      <a 
                        href="https://transactproof.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 underline transition-colors duration-300 ml-1"
                      >
                        https://transactproof.com
                      </a>
                    </p>
                  </div>
                </div>
              </section>

            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 sm:mt-12 text-center">
            <Link href="/" className="inline-flex items-center justify-center px-8 py-3 font-light tracking-wide border border-orange-400 text-orange-400 rounded-lg">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}