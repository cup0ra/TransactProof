'use client'

import { toast } from 'react-hot-toast'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'

interface SupportedNetworksMarqueeProps {
  networks: string[]
}

const NETWORK_TO_CHAIN_ID: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Polygon: 137,
  Optimism: 10,
  Arbitrum: 42161,
  zkSync: 324,
  BNB: 56,
  Avalanche: 43114,
}

export function SupportedNetworksMarquee({ networks }: SupportedNetworksMarqueeProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const handleNetworkClick = async (network: string) => {
    if (!isConnected) {
      return
    }

    const targetChainId = NETWORK_TO_CHAIN_ID[network]
    if (!targetChainId || targetChainId === chainId) {
      return
    }

    try {
      await switchChain({ chainId: targetChainId })
      toast.success(`Switched to ${network}`)
    } catch {
      toast.error(`Failed to switch to ${network}`)
    }
  }

  return (
    <div className="supported-networks-marquee">
      <div className="supported-networks-track items-stretch">
        {[...networks, ...networks].map((network, index) => (
          <button
            key={`${network}-${index}`}
            type="button"
            onClick={() => handleNetworkClick(network)}
            className="supported-network-card card-hover flex flex-col items-center justify-center p-3 sm:p-4 min-w-[130px] sm:min-w-[150px] bg-white/50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-orange-400/10 dark:hover:bg-orange-400/10"
          >
            <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">{network}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
