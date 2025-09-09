'use client'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
            <h1 className="text-xl sm:text-2xl font-light text-black dark:text-white tracking-wide">Privacy Policy</h1>
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
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">1. Introduction</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>
                    TransactProof ("we", "our", "us") provides a service that generates PDF receipts for blockchain transactions. 
                    This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
                  </p>
                  <p>
                    By using TransactProof, you agree to the terms of this Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">2. Information We Collect</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>We aim to collect as little personal information as possible.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Wallet Address:</h3>
                      <p>When you sign in with your crypto wallet, we store your wallet address to identify your account.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Transaction Data:</h3>
                      <p>We may temporarily fetch and process transaction details (e.g., tx-hash, sender, receiver, amount, timestamp) to generate receipts.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Receipts:</h3>
                      <p>Generated PDF receipts are stored in our database/storage so you can access them later.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Technical Data:</h3>
                      <p>We may log IP addresses, browser type, and device information for security and analytics purposes.</p>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 mt-6">
                    <p className="text-orange-800 dark:text-orange-200 font-normal">
                      We do not collect private keys or have access to your funds. You remain in full control of your crypto wallet.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">3. How We Use Your Information</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>We use the collected information to:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Provide and improve the receipt generation service.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Authenticate users through wallet login (Sign-In with Ethereum).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Verify payments (e.g., 0.0000001 ETH transaction).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Deliver generated receipts (PDF).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Detect and prevent fraud or abuse.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Comply with legal requirements, if applicable.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">4. Data Storage & Retention</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Receipts:</h3>
                      <p>Stored securely in our cloud storage.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Session Data:</h3>
                      <p>Stored temporarily (JWT tokens in HttpOnly cookies).</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Nonces (login codes):</h3>
                      <p>Expire within minutes and are marked as used.</p>
                    </div>
                    
                    <div>
                      <h3 className="text-orange-400 font-normal mb-2">Retention:</h3>
                      <p>We keep data only as long as necessary to provide the service. You may request deletion at any time (see Section 7).</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">5. Sharing of Information</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p><strong>We do not sell or rent your information.</strong></p>
                  <p>We may share limited information only in these cases:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>With service providers (cloud hosting, database, analytics).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>If required by law or legal process.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>To protect the rights, safety, or security of our users or our service.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 6 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">6. Security</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>We implement technical and organizational measures to protect your data, including:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Encrypted database storage.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>TLS/HTTPS for all connections.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>HttpOnly and Secure cookies for session tokens.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>No storage of private keys or sensitive wallet credentials.</span>
                    </li>
                  </ul>
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      However, no method of online transmission or storage is 100% secure. You use our service at your own risk.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 7 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">7. Your Rights</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>Depending on your jurisdiction (e.g., GDPR, CCPA), you may have rights to:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Request a copy of your data.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Request correction or deletion of your data.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Withdraw consent and stop using the service.</span>
                    </li>
                  </ul>
                  <p className="mt-4">
                    Contact us at{' '}
                    <a 
                      href="mailto:support@transactproof.com" 
                      className="text-orange-400 underline"
                    >
                      support@transactproof.com
                    </a>
                    {' '}to exercise these rights.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">8. Third-Party Services</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>Our service may use APIs and providers such as:</p>
                  <ul className="space-y-2 ml-6">
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Blockchain RPC (Alchemy, Infura, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Price feeds (CoinGecko, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>Cloud storage</span>
                    </li>
                  </ul>
                  <p>These services may collect limited technical data. Please review their privacy policies.</p>
                </div>
              </section>

              {/* Section 9 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">9. Children's Privacy</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>Our service is not intended for children under 18. We do not knowingly collect personal data from minors.</p>
                </div>
              </section>

              {/* Section 10 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">10. Changes to this Policy</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>We may update this Privacy Policy from time to time. Updates will be posted on this page with a new "Last updated" date.</p>
                </div>
              </section>

              {/* Section 11 */}
              <section className="mb-8">
                <h2 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide">11. Contact Us</h2>
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-light leading-relaxed">
                  <p>If you have questions, please contact us:</p>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <span className="text-orange-400 mr-2">📧</span>
                      <span>Email: </span>
                      <a 
                        href="mailto:support@transactproof.com" 
                        className="text-orange-400 hover:text-orange-300 underline ml-1"
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
                        className="text-orange-400 hover:text-orange-300 underline ml-1"
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