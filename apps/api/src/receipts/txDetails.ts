import {
  Chain,
  createPublicClient,
  http,
  formatUnits,
  decodeEventLog,
  parseAbi,
  TransactionReceipt,
} from 'viem'

/**
 * Signature topic for ERC-20 Transfer(address,address,uint256)
 */
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

/** Minimal ERC-20 ABI for metadata & Transfer decoding */
const ERC20_METADATA_ABI = parseAbi([
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
])

/** Params for getTxDetails */
export interface GetTxDetailsParams {
  hash: `0x${string}`
  chain: Chain
  publicRpcUrl: string
  traceRpcUrl?: string
  loadTokenMeta?: boolean
}

/** Internal native (ETH / MATIC / etc.) transfer extracted from call trace */
export interface InternalNativeTransfer {
  from: string
  to: string
  valueWei: bigint
  valueFormatted: string
  callType?: string
}

/** ERC-20 transfer decoded from transaction logs */
export interface Erc20Transfer {
  tokenAddress: string
  from: string
  to: string
  valueRaw: bigint
  valueFormatted: string
  symbol?: string
  decimals?: number
}

/** Result object of getTxDetails */
export interface TxDetailsResult {
  receipt: TransactionReceipt
  internalNativeTransfers: InternalNativeTransfer[]
  erc20Transfers: Erc20Transfer[]
  tx: any
}

/** Cache for token metadata lookups */
const tokenMetaCache: Map<string, { symbol?: string; decimals?: number }> = new Map()

/**
 * Fetch ERC-20 token metadata (symbol & decimals) with caching.
 */
async function fetchTokenMeta(
  client: ReturnType<typeof createPublicClient>,
  tokenAddress: string
): Promise<{ symbol?: string; decimals?: number }> {
  const lower = tokenAddress.toLowerCase()
  const cached = tokenMetaCache.get(lower)
  if (cached) return cached
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        abi: ERC20_METADATA_ABI,
        address: tokenAddress as `0x${string}`,
        functionName: 'symbol',
      }).catch(() => undefined),
      client.readContract({
        abi: ERC20_METADATA_ABI,
        address: tokenAddress as `0x${string}`,
        functionName: 'decimals',
      }).catch(() => undefined),
    ])
    const meta = { symbol: symbol as string | undefined, decimals: typeof decimals === 'number' ? decimals : undefined }
    tokenMetaCache.set(lower, meta)
    return meta
  } catch {
    const fallback = { symbol: undefined, decimals: undefined }
    tokenMetaCache.set(lower, fallback)
    return fallback
  }
}

/**
 * Decode all ERC-20 Transfer logs from a receipt.
 */
async function decodeErc20Transfers(
  receipt: TransactionReceipt,
  client: ReturnType<typeof createPublicClient>,
  loadTokenMeta: boolean
): Promise<Erc20Transfer[]> {
  const transfers: Erc20Transfer[] = []
  // Some viem receipt log typings may omit topics; assert extended shape when present.
  type LogWithTopics = typeof receipt.logs[number] & { topics?: [signature: `0x${string}`, ...rest: `0x${string}`[]] }
  for (const raw of receipt.logs as LogWithTopics[]) {
    const topics = raw.topics as [signature: `0x${string}`, ...rest: `0x${string}`[]] | undefined
    if (!topics || topics.length < 3) continue
    if (topics[0].toLowerCase() !== TRANSFER_TOPIC) continue
    try {
      const decoded = decodeEventLog({
        abi: ERC20_METADATA_ABI,
        data: raw.data,
        topics,
      })
      if (decoded.eventName !== 'Transfer') continue
      const args = decoded.args as { from: string; to: string; value: bigint }
      let symbol: string | undefined
      let decimals: number | undefined
      if (loadTokenMeta) {
        const meta = await fetchTokenMeta(client, raw.address)
        symbol = meta.symbol
        decimals = meta.decimals
      }
      const usedDecimals = decimals ?? 18
      transfers.push({
        tokenAddress: raw.address,
        from: args.from,
        to: args.to,
        valueRaw: args.value,
        valueFormatted: formatUnits(args.value, usedDecimals),
        symbol,
        decimals,
      })
    } catch {
      continue
    }
  }
  return transfers
}

/** Shape of a single trace item (common for OpenEthereum / Erigon / Nethermind). */
interface RawTraceItem {
  type: string
  action?: {
    callType?: string
    from?: string
    to?: string
    value?: string // hex value
  }
  result?: unknown
  error?: string
  traceAddress?: (number | string)[]
  subtraces?: number
}

/** Convert hex value string to bigint safely */
function hexToBigIntSafe(hex?: string): bigint {
  if (!hex) return 0n
  try {
    return BigInt(hex)
  } catch {
    return 0n
  }
}

/**
 * Parse internal native transfers from trace_transaction response.
 */
function parseInternalTransfers(
  traces: RawTraceItem[],
  nativeDecimals: number
): InternalNativeTransfer[] {
  const out: InternalNativeTransfer[] = []
  for (const trace of traces) {
    if (trace.type !== 'call') continue
    const valueWei = hexToBigIntSafe(trace.action?.value)
    if (valueWei === 0n) continue
    const from = trace.action?.from || ''
    const to = trace.action?.to || ''
    out.push({
      from,
      to,
      valueWei,
      valueFormatted: formatUnits(valueWei, nativeDecimals),
      callType: trace.action?.callType,
    })
  }
  return out
}

/**
 * Universal function to obtain detailed transaction info for any EVM chain.
 *
 * Features:
 *  - Fetches transaction receipt.
 *  - Decodes all ERC-20 Transfer logs (with optional metadata lookup).
 *  - Fetches internal native value transfers using `trace_transaction` if a trace RPC is provided.
 *
 * @example
 * const { receipt, internalNativeTransfers, erc20Transfers } = await getTxDetails({
 *   hash: '0x...',
 *   chain: polygon,
 *   publicRpcUrl: 'https://polygon-rpc.com',
 *   traceRpcUrl: 'https://trace.matic.quicknode.pro/KEY'
 * })
 */
export async function getTxDetails(params: GetTxDetailsParams): Promise<TxDetailsResult> {
  const { hash, chain, publicRpcUrl, traceRpcUrl, loadTokenMeta = true } = params

  // Public client for standard receipt / logs / contract reads
  const publicClient = createPublicClient({ chain, transport: http(publicRpcUrl) })

  // Fetch receipt (throws if not found)
  const receipt = await publicClient.getTransactionReceipt({ hash })
  const tx = await publicClient.getTransaction({ hash })


  // Decode ERC-20 transfers
  const erc20Transfers = await decodeErc20Transfers(receipt, publicClient, loadTokenMeta)

  // Internal native transfers via trace_transaction
  let internalNativeTransfers: InternalNativeTransfer[] = []
  if (traceRpcUrl) {
    try {
      const traceClient = createPublicClient({ chain, transport: http(traceRpcUrl) })
      const traces = (await traceClient.request({
        method: 'trace_transaction',
        params: [hash],
      })) as RawTraceItem[]
      const nativeDecimals = chain.nativeCurrency?.decimals ?? 18
      internalNativeTransfers = parseInternalTransfers(traces, nativeDecimals)
    } catch (e) {
      // Silently ignore trace failures; user might have provided RPC without tracing support
      internalNativeTransfers = []
    }
  }

  return {
    tx,
    receipt,
    internalNativeTransfers,
    erc20Transfers,
  }
}

export default getTxDetails
