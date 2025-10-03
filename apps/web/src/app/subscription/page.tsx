"use client"

import React, { useRef, useState, useCallback } from 'react'
import { Button } from '@transactproof/ui'
import { PAYMENT_AMOUNT, getTokenContractAddress, getAvailablePaymentOptions, PAYMENT_AMOUNT_PACK, PAYMENT_AMOUNT_SUBSCRIPTION } from '@/config'
import { useRouter } from 'next/navigation'
import { ParallaxBackground } from '@/components/parallax-background'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useChainId, useAccount } from 'wagmi'
import { usePayToken } from '@/hooks/use-pay-token'
import { useTokenBalance } from '@/hooks/use-token-balance'
import { useMultiTokenBalance } from '@/hooks/use-multi-token-balance'
import { toast } from 'react-hot-toast'
import { ApiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'

// Subscription actions with callback when pack purchase is initiated
function useSubscriptionActions(onShowPackTokens: () => void, onShowSubTokens: () => void) {
  const router = useRouter()

  const handleSingleGeneration = () => {
    // For single generation we assume user will pay using existing token payment flow on generate page
    router.push('/generate')
  }

  const handleTwentyFree = () => {
    onShowPackTokens()
  }

  const handleMonthly = () => {
    onShowSubTokens()
  }

  return { handleSingleGeneration, handleTwentyFree, handleMonthly }
}

interface PlanCardProps {
  title: string
  price: string
  description: string
  features: string[]
  cta: string
  onSelect: () => void
  highlight?: boolean
}
const PlanCard: React.FC<PlanCardProps & { footerContent?: React.ReactNode; subtitleOverride?: React.ReactNode; hideAction?: boolean }> = ({ title, price, description, features, cta, onSelect, highlight, footerContent, subtitleOverride, hideAction }) => (
  <div className={`relative flex flex-col h-full border  p-6 backdrop-blur-sm transition-all duration-300 ${highlight ? 'border-orange-400/80 bg-white/70 dark:bg-black/60 shadow-[0_0_0_1px_rgba(249,115,22,0.4),0_8px_30px_-10px_rgba(249,115,22,0.25)]' : 'border-gray-300/40 dark:border-gray-800/60 bg-white/30 dark:bg-black/40'} hover:border-orange-400/80`}> 
    {highlight && (
  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-400 text-white dark:text-black text-xs tracking-wide font-medium px-3 py-1  shadow">POPULAR</span>
    )}
    <div className="mb-4">
      <h3 className="text-xl font-light tracking-wide text-black dark:text-white mb-2">{title}</h3>
  <p className="text-3xl font-thin text-black dark:text-white mb-2"><span className="font-medium">{price}</span></p>
  {subtitleOverride}
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed min-h-[40px]">{description}</p>
    </div>
    <ul className="flex-1 mb-6 space-y-2 text-xs text-gray-700 dark:text-gray-300">
      {features.map(f => (
        <li key={f} className="flex items-start gap-2">
          <span className="mt-0.5 inline-block w-2 h-2 rounded-full bg-orange-400" />
          <span>{f}</span>
        </li>
      ))}
    </ul>
    {!hideAction && (footerContent ? footerContent : (
      <Button 
        onClick={onSelect} 
        variant={!highlight ? 'outline' : 'secondary'}
        size="lg" 
        className={
          highlight
            ? 'bg-orange-400 text-white dark:text-black rounded-none hover:bg-orange-600 hover:text-white dark:hover:text-black transition-all duration-300 border-2 border-transparent hover:border-orange-600 tracking-wide focus:outline-none focus:ring-0 focus:ring-offset-0'
            : 'bg-white/20 dark:bg-black/20 font-light text-orange-400 dark:text-orange-400 border border-orange-400 rounded-none hover:border-orange-500 hover:text-orange-500 hover:bg-orange-950/10 dark:hover:bg-orange-950 transition-all duration-300 tracking-wide focus:outline-none focus:ring-0 focus:ring-offset-0'
        }
      >
        {cta}
      </Button>
    ))}
  </div>
)

export default function SubscriptionPage() {
  const [showPackTokens, setShowPackTokens] = useState(false)
  const [showSubTokens, setShowSubTokens] = useState(false)
  const { handleSingleGeneration, handleTwentyFree, handleMonthly } = useSubscriptionActions(() => setShowPackTokens(true), () => setShowSubTokens(true))
  const chainId = useChainId()
  const { address, isConnected } = useAccount()
  const { payToken, isLoading: isPayingToken } = usePayToken()
  const { checkAuth, isAuthenticated } = useAuth()
  const [isProcessingPack, setIsProcessingPack] = useState(false)
  const [isProcessingSub, setIsProcessingSub] = useState(false)
  const availablePackTokens = getAvailablePaymentOptions(chainId || 1).filter(p => p.type === 'USDT' || p.type === 'USDC')
  const availableSubTokens = availablePackTokens // same set for now
  type TokenOption = typeof availablePackTokens[number] | undefined
  const [selectedPackToken, setSelectedPackToken] = useState<TokenOption>(availablePackTokens[0])
  const [selectedSubToken, setSelectedSubToken] = useState<TokenOption>(availableSubTokens[0])

  // Update selection if network changed or first option shifts
  React.useEffect(() => {
    if (!selectedPackToken || !availablePackTokens.some(p => p.type === selectedPackToken.type)) {
      setSelectedPackToken(availablePackTokens[0])
    }
    if (!selectedSubToken || !availableSubTokens.some(p => p.type === selectedSubToken.type)) {
      setSelectedSubToken(availableSubTokens[0])
    }
    if (!isConnected) {
      setShowPackTokens(false)
      setShowSubTokens(false)
    }
  }, [chainId, availablePackTokens, availableSubTokens, selectedPackToken, selectedSubToken, isConnected])

  // Balance hooks (reuse existing logic style from receipt-generator)
  const { hasInsufficientBalance: hasInsufficientDirectTokenBalance } = useTokenBalance(
    selectedPackToken?.contractAddress || undefined,
    selectedPackToken?.decimals
  )
  const { hasInsufficientBalance: hasInsufficientMulti, contractAddress: detectedPackAddress } = useMultiTokenBalance(
    selectedPackToken?.type || '',
    selectedPackToken?.decimals
  )
  const insufficientPackBalance = React.useMemo(() => {
    const raw = hasInsufficientMulti ?? hasInsufficientDirectTokenBalance
    if (typeof raw === 'function') {
      try { return raw(PAYMENT_AMOUNT_PACK) } catch { return true }
    }
    return !!raw
  }, [hasInsufficientMulti, hasInsufficientDirectTokenBalance])

  const purchasePack = useCallback(async () => {
    const symbol = selectedPackToken?.type as 'USDT' | 'USDC'
    if (!isConnected || !address) {
      toast.error('Connect wallet')
      return
    }
    if (!isAuthenticated) {
      toast.error('Authenticate first')
      return
    }
    if (!symbol) {
      toast.error('Select token')
      return
    }
  const contract = detectedPackAddress || getTokenContractAddress(symbol, chainId)
    if (!contract) {
      toast.error(`${symbol} not supported on this network`)
      return
    }
    try {
      setIsProcessingPack(true)
      const toastId = 'pack'
  toast.loading(`Paying ${PAYMENT_AMOUNT_PACK} ${symbol}...`, { id: toastId, duration: Infinity })
  const txHash = await payToken(contract, PAYMENT_AMOUNT_PACK, symbol, 6)
      if (!txHash) {
        toast.error('Transaction rejected', { id: toastId })
        return
      }
  toast.loading('Verifying payment...', { id: toastId, duration: Infinity })
      const resp = await ApiClient.post('/api/receipts/purchase-pack', {
        paymentTxHash: txHash,
        paymentAmount: PAYMENT_AMOUNT_PACK,
        paymentType: symbol,
        paymentContractAddress: contract,
      })
      const data = await resp.json()
  // Replace persistent loader with a finite success toast
  toast.dismiss(toastId)
  toast.success(`+${data.added} generations added. Total: ${data.freeGenerationsRemaining}`, { duration: 4000 })
      setShowPackTokens(false)
      try { await checkAuth() } catch {}
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Purchase failed'
  toast.dismiss('pack')
  toast.error(message, { duration: 5000 })
    } finally {
      setIsProcessingPack(false)
    }
  }, [isConnected, address, isAuthenticated, chainId, payToken, checkAuth, selectedPackToken, detectedPackAddress])

  // Subscription payment (monthly)
  const { hasInsufficientBalance: hasInsufficientSubDirect } = useTokenBalance(
    selectedSubToken?.contractAddress || undefined,
    selectedSubToken?.decimals
  )
  const { hasInsufficientBalance: hasInsufficientSubMulti, contractAddress: detectedSubAddress } = useMultiTokenBalance(
    selectedSubToken?.type || '',
    selectedSubToken?.decimals
  )
  const insufficientSubBalance = React.useMemo(() => {
    const raw = hasInsufficientSubMulti ?? hasInsufficientSubDirect
    if (typeof raw === 'function') {
      try { return raw(PAYMENT_AMOUNT_SUBSCRIPTION) } catch { return true }
    }
    return !!raw
  }, [hasInsufficientSubMulti, hasInsufficientSubDirect])

  const purchaseSubscription = useCallback(async () => {
    const symbol = selectedSubToken?.type as 'USDT' | 'USDC'
    if (!isConnected || !address) { toast.error('Connect wallet'); return }
    if (!isAuthenticated) { toast.error('Authenticate first'); return }
    if (!symbol) { toast.error('Select token'); return }
    const contract = detectedSubAddress || getTokenContractAddress(symbol, chainId)
    if (!contract) { toast.error(`${symbol} not supported`); return }
    try {
      setIsProcessingSub(true)
      const toastId = 'sub'
  toast.loading(`Paying ${PAYMENT_AMOUNT_SUBSCRIPTION} ${symbol}...`, { id: toastId, duration: Infinity })
      const txHash = await payToken(contract, PAYMENT_AMOUNT_SUBSCRIPTION, symbol, 6)
      if (!txHash) { toast.error('Transaction rejected', { id: toastId }); return }
  toast.loading('Verifying subscription...', { id: toastId, duration: Infinity })
      const resp = await ApiClient.post('/api/receipts/purchase-subscription', {
        paymentTxHash: txHash,
        paymentAmount: PAYMENT_AMOUNT_SUBSCRIPTION,
        paymentType: symbol,
        paymentContractAddress: contract,
      })
  await resp.json()
  toast.dismiss(toastId)
  toast.success('Subscription activated!', { duration: 4500 })
      setShowSubTokens(false)
      try { await checkAuth() } catch {}
    } catch (e: unknown) {
  toast.dismiss('sub')
  toast.error(e instanceof Error ? e.message : 'Subscription failed', { duration: 5000 })
    } finally {
      setIsProcessingSub(false)
    }
  }, [isConnected, address, isAuthenticated, chainId, payToken, checkAuth, selectedSubToken, detectedSubAddress])

    const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  const auth = useAuth()
  const now = new Date()
  let activeUntil: Date | null = null
  if (auth.user?.freeUntil) {
    const raw = auth.user.freeUntil as unknown
    if (raw instanceof Date) {
      activeUntil = raw
    } else if (typeof raw === 'string' || typeof raw === 'number') {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) activeUntil = d
    }
  }
  const hasActiveSubscription = !!activeUntil && activeUntil > now
  const formattedUntil = hasActiveSubscription && activeUntil ? activeUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null

  const plans: (PlanCardProps & { footerContent?: React.ReactNode; subtitleOverride?: React.ReactNode; hideAction?: boolean })[] = [
    {
  title: 'Single Generation',
  price: `$${PAYMENT_AMOUNT}`,
  description: 'Pay for a single generation and immediately proceed to create a PDF receipt.',
      features: [
        'Instant access',
        'One professional receipt',
        'Multi-network support',
      ],
      cta: 'Create',
      onSelect: handleSingleGeneration,
      hideAction: !isConnected,
    },
    {
      title: '20 Generations Pack',
      price: `$${PAYMENT_AMOUNT_PACK}`,
      description: 'Save with a bundle — 20 generations for a fixed price.',
      features: [
        '20 prepaid generations',
        'Priority processing',
        'Fixed one-time price',
        'No monthly commitment',
      ],
      cta: 'Buy Pack',
      onSelect: handleTwentyFree,
      highlight: true,
      hideAction: !isConnected,
      footerContent: showPackTokens ? (
        (isPayingToken || isProcessingPack) ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-600 dark:text-gray-400 tracking-wide">Processing payment...</p>
            <p className="text-[10px] text-gray-500">Do not close this window</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-wide text-orange-500">Select Token</div>
            <div className="grid grid-cols-2 gap-3">
              {availablePackTokens.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedPackToken(opt)}
                  className={`p-3 border text-xs tracking-wide transition-all ${selectedPackToken?.type === opt.type ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-gray-300 dark:border-gray-700 hover:border-gray-500'}`}
                >{opt.symbol}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isPayingToken || isProcessingPack}
                onClick={() => setShowPackTokens(false)}
                className="text-xs py-2 border border-gray-300 dark:border-gray-700 hover:border-orange-400 hover:text-orange-500 transition disabled:opacity-50"
              >Cancel</button>
              <button
                type="button"
                disabled={isPayingToken || isProcessingPack || insufficientPackBalance || !selectedPackToken}
                onClick={purchasePack}
                className={`text-xs py-2 transition ${
                  (isPayingToken || isProcessingPack || insufficientPackBalance || !selectedPackToken)
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                    : ' bg-orange-400 text-white dark:text-black rounded-none hover:bg-orange-600 hover:text-white dark:hover:text-black'
                }`}
              >{insufficientPackBalance
                  ? `Insufficient ${selectedPackToken?.symbol}`
                  : `Pay ${PAYMENT_AMOUNT_PACK} ${selectedPackToken?.symbol || ''}`}
              </button>
            </div>
            <div className="text-[10px] text-gray-500 text-center">Payment adds 20 free generations</div>
          </div>
        )
      ) : undefined,
    },
    {
      title: 'Monthly Subscription',
      price: `$${PAYMENT_AMOUNT_SUBSCRIPTION}`,
      description: 'High-volume usage for 30 days (fair use policy applies).',
      features: [
        'Up to 500 generations / month',
        'Priority support',
        'Future features included',
      ],
      cta: hasActiveSubscription ? 'Active' : 'Subscribe',
      onSelect: hasActiveSubscription ? () => {} : handleMonthly,
      subtitleOverride: undefined,
      hideAction: !isConnected,
      footerContent: hasActiveSubscription ? (
        <div className="flex flex-col items-center justify-center gap-2 py-4 mt-auto">
          <div className="text-[11px] uppercase tracking-wide text-orange-500">Subscription Active</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Until {formattedUntil}</div>
        </div>
      ) : showSubTokens ? (
        (isProcessingSub || isPayingToken) ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-600 dark:text-gray-400 tracking-wide">Processing subscription...</p>
            <p className="text-[10px] text-gray-500">Do not close this window</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-wide text-orange-500">Select Token</div>
            <div className="grid grid-cols-2 gap-3">
              {availableSubTokens.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedSubToken(opt)}
                  className={`p-3 border text-xs tracking-wide transition-all ${selectedSubToken?.type === opt.type ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-gray-300 dark:border-gray-700 hover:border-gray-500'}`}
                >{opt.symbol}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isProcessingSub || isPayingToken}
                onClick={() => setShowSubTokens(false)}
                className="text-xs py-2 border border-gray-300 dark:border-gray-700 hover:border-orange-400 hover:text-orange-500 transition disabled:opacity-50"
              >Cancel</button>
              <button
                type="button"
                disabled={isProcessingSub || isPayingToken || insufficientSubBalance || !selectedSubToken}
                onClick={purchaseSubscription}
                className={`text-xs py-2 transition ${
                  (isProcessingSub || isPayingToken || insufficientSubBalance || !selectedSubToken)
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                    : 'bg-orange-400 text-white dark:text-black rounded-none hover:bg-orange-600 hover:text-white dark:hover:text-black'
                }`}
              >{insufficientSubBalance
                  ? `Insufficient ${selectedSubToken?.symbol}`
                  : `Pay ${PAYMENT_AMOUNT_SUBSCRIPTION} ${selectedSubToken?.symbol || ''}`}
              </button>
            </div>
            <div className="text-[10px] text-gray-500 text-center">30 days access • counter set to 500</div>
          </div>
        )
      ) : undefined,
    },
  ]

  // Motion variants
  const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const easeOutSoft: [number, number, number, number] = [0.25, 0.8, 0.25, 1]
  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutExpo } }
  } as const
  const connectVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutSoft, delay: 0.2 } }
  } as const
  const cardsContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
  } as const
  const cardItem = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: easeOutSoft } }
  } as const

  return (
     <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden py-16 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="absolute inset-0"
            style={{ y, opacity }}
          >
            <ParallaxBackground 
              enableParallax={false} // motion.div handles parallax
            />
          </motion.div>
      {/* Overlay to improve contrast */}

      <div className="relative max-w-6xl mx-auto z-10 ">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={headingVariants}
          className="text-center mb-16"
        >
          <h1 className="text-3xl sm:text-5xl font-thin tracking-wide text-black dark:text-white mb-6">Subscriptions & Plans</h1>
          <p className="text-black dark:text-white max-w-2xl mx-auto text-sm sm:text-base font-light">Choose what fits your usage — single payment, bundle, or full subscription. Start small and upgrade anytime.</p>
        </motion.div>
        {!isConnected && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={connectVariants}
            className="mb-10 -mt-6 text-center text-xs sm:text-sm text-orange-600 dark:text-orange-400 tracking-wide"
          >
            Connect your wallet to buy a generation pack or start a subscription.
          </motion.div>
        )}
        <motion.div
          className="relative grid md:grid-cols-3 gap-8 justify-center mx-auto max-w-6xl"
          variants={cardsContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {plans.map(plan => (
            <motion.div
              key={plan.title}
              variants={cardItem}
              className="max-w-sm mx-auto w-full"
            >
              <PlanCard {...plan} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
