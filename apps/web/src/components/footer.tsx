import Link from 'next/link'
export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black py-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <span className="text-sm font-light tracking-wide text-black dark:text-white transition-colors duration-300">TransactProof</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-light leading-relaxed transition-colors duration-300">
              Professional PDF receipts for crypto transactions on Base network.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-light text-xs uppercase tracking-wider mb-6 text-orange-400">Product</h3>
            <ul className="space-y-3 text-xs text-gray-600 dark:text-gray-400 font-light">
              <li><Link href="/generate" className="hover:text-orange-400 transition-colors duration-300">Generate Receipt</Link></li>
              <li><Link href="/dashboard" className="hover:text-orange-400 transition-colors duration-300">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-light text-xs uppercase tracking-wider mb-6 text-orange-400">Support</h3>
            <ul className="space-y-3 text-xs text-gray-600 dark:text-gray-400 font-light">
              <li><Link href="/help-center" className="hover:text-orange-400 transition-colors duration-300">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-light text-xs uppercase tracking-wider mb-6 text-orange-400">Legal</h3>
            <ul className="space-y-3 text-xs text-gray-600 dark:text-gray-400 font-light">
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors duration-300">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors duration-300">Terms of Service</Link></li>
              <li><Link href="/disclaimer" className="hover:text-orange-400 transition-colors duration-300">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-300 dark:border-gray-900 mt-12 pt-8 text-center transition-colors duration-300">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-500 font-light transition-colors duration-300">&copy; 2024 TransactProof. All rights reserved.</p>
            <p className="text-xs text-gray-600 dark:text-gray-600 font-light transition-colors duration-300">Not financial or tax advice. For informational purposes only.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}