'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePdfBranding } from '@/hooks/use-pdf-branding'
import { ApiClient } from '@/lib/api-client'
import { ParallaxBackground } from '@/components/parallax-background'

// Dynamic import for motion to reduce bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

export default function CustomizePdfPage() {
  const { branding, update, reset, loaded, dirty, markSaved } = usePdfBranding()
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  // Deprecated local showDetails; use persisted branding preference instead
  const showDetails = branding.showErc20Transfers === true

  useEffect(() => { setMounted(true) }, [])

  const MAX_LOGO_BYTES = 500 * 1024 // 500KB limit

  const handleFile = (file: File) => {
    setLogoError(null)
    if (!file.type.startsWith('image/')) {
      setLogoError('Unsupported file type. Please select an image.')
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('File too large. Max 500KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      update({ logoDataUrl: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const removeLogo = () => { update({ logoDataUrl: undefined }); setLogoError(null) }

  return (
    <section className='relative min-h-screen overflow-hidden'>
                      <ParallaxBackground 
                enableParallax={true}
                parallaxSpeed={0.3}
                minOpacity={0.4}
                opacityFadeRate={0.0008}
                className="z-0"
              />
      <div className='relative max-w-3xl mx-auto  py-16 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8'>
        <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div >
                <h1 className='text-xl font-light tracking-wide mb-2'>Customize PDF Receipt</h1>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-8'>Add your company branding that will be used when generating receipts.</p>
            </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Link href='/dashboard' className='btn-secondary-minimal text-xs py-2 px-4 text-center'>Back to Dashboard</Link>
          </div>
            </div>
        </MotionDiv>

        {!loaded && (
          <div className='text-xs text-gray-500 animate-pulse mb-8'>Loading saved branding...</div>
        )}

        <div className='space-y-8'>
          {/* Company Info + Logo (combined) */}
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className='border border-gray-200 dark:border-gray-800 p-6 bg-white/50 dark:bg-black/40 backdrop-blur-sm'>
            <div className='flex items-start justify-between mb-4 gap-4'>
              <h2 className='text-sm uppercase tracking-wider font-medium text-orange-500'>Company Information</h2>
              <div className='flex items-center gap-2'>
                {saveStatus === 'saved' && <span className='text-[10px] text-green-600'>Saved</span>}
                {saveStatus === 'error' && <span className='text-[10px] text-red-500'>Error</span>}
                {saveStatus === 'saving' && <span className='text-[10px] text-orange-500'>Saving...</span>}
                {dirty && saveStatus==='idle' && <span className='text-[10px] text-orange-500'>Unsaved changes</span>}
                <button onClick={reset} className='text-[11px] px-3 py-1.5 border border-orange-500/40 text-orange-600 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>Reset</button>
                <button
                  onClick={async () => {
                    setSaveStatus('saving')
                    try {
                      await ApiClient.post('/api/receipts/my/branding', branding)
                      markSaved()
                      setSaveStatus('saved')
                      setTimeout(()=> setSaveStatus('idle'), 2000)
                    } catch (e) {
                      setSaveStatus('error')
                      setTimeout(()=> setSaveStatus('idle'), 3000)
                    }
                  }}
                  className='text-[11px] px-3 py-1.5 border border-orange-500/40 text-orange-600 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={!loaded || saveStatus==='saving' || !dirty}
                >Save</button>
              </div>
            </div>
            <div className='flex flex-col md:flex-row gap-8'>
              {/* Left: Inputs */}
              <div className='flex-1 flex flex-col gap-4'>
                <div className='flex flex-col gap-1'>
                  <label className='text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400'>Company Name</label>
                  <input
                    className='px-3 py-2 text-xs bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500'
                    value={branding.companyName}
                    onChange={e => update({ companyName: e.target.value })}
                    placeholder='e.g. My Crypto LLC'
                  />
                </div>
                <div className='flex flex-col gap-1'>
                  <label className='text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400'>Website</label>
                  <input
                    className='px-3 py-2 text-xs bg-white/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500'
                    value={branding.website}
                    onChange={e => update({ website: e.target.value })}
                    placeholder='https://example.com'
                  />
                </div>
                <div className='mt-2'>
                  <label className='flex items-center gap-2 text-[11px] cursor-pointer select-none'>
                    <input
                      type='checkbox'
                      checked={showDetails}
                      onChange={e => update({ showErc20Transfers: e.target.checked })}
                      className='h-4 w-4 cursor-pointer rounded-sm border border-gray-400 dark:border-gray-600 text-orange-500 appearance-none outline-none focus:outline-none focus-visible:outline-none transition-colors checked:bg-orange-500 checked:border-orange-500 checked:hover:bg-orange-600'
                    />
                    <span className='text-gray-700 dark:text-gray-300'>Show transaction details</span>
                  </label>
                </div>
              </div>

              {/* Right: Logo Uploader */}
              <div className='w-full md:w-64'>
                <div
                  onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={onDrop}
                  onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
                  className={`relative border-2 border-dashed rounded-sm p-4 flex flex-col items-center justify-center text-center transition-colors duration-300 min-h-[180px] ${dragActive ? 'border-orange-400 bg-orange-50/40 dark:bg-orange-500/10' : 'border-gray-300 dark:border-gray-700'}`}
                >
                  {branding.logoDataUrl ? (
                    <div className='flex flex-col items-center gap-3 w-full'>
                      <div className='relative w-25 h-25 bg-orange-500/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={branding.logoDataUrl} alt='Logo preview' className='max-h-24 max-w-24 object-contain' />
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          aria-label='Change logo'
                          title='Change logo'
                          className='w-8 h-8 flex items-center justify-center p-0 border-0 bg-transparent hover:bg-orange-500/10 text-orange-500 dark:text-orange-500 hover:text-orange-500 transition-colors'
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <path d='M11 4H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-7' />
                            <path d='M18.375 2.625a1.767 1.767 0 0 1 2.5 2.5L12 14l-4 1 1-4 9.375-8.375Z' />
                          </svg>
                        </button>
                        <button
                          onClick={removeLogo}
                          aria-label='Remove logo'
                          title='Remove logo'
                          className='w-8 h-8 flex items-center justify-center p-0 border-0 bg-transparent hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors'
                        >
                          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' className='w-4 h-4'>
                            <path d='M3 6h18' />
                            <path d='M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2' />
                            <path d='M10 11v6' />
                            <path d='M14 11v6' />
                            <path d='M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14' />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className='text-[11px] text-gray-600 dark:text-gray-400'>Drag & drop logo</p>
                      <p className='text-[10px] text-gray-500 dark:text-gray-500'>PNG / JPG / SVG • Max 500KB</p>
                      <button onClick={() => fileInputRef.current?.click()} className='mt-3 btn-primary-minimal text-[11px] px-3 py-1.5'>Select File</button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
                  />
                </div>
                {logoError && <p className='mt-2 text-[10px] text-red-500 text-center'>{logoError}</p>}
              </div>
            </div>
          </MotionDiv>

          {/* Full Template Preview (Server HTML Approximation) */}
          <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className='border border-gray-200 dark:border-gray-800 p-6 bg-white/60 dark:bg-black/40 backdrop-blur-sm'>
            <h2 className='text-sm uppercase tracking-wider font-medium text-orange-500 mb-4'>Preview (PDF Template)</h2>
            {mounted && (() => {
              // Helper mimicking server-side network name resolution
              const getNetworkName = (chainId: number) => {
                switch (chainId) {
                  case 8453: return 'BASE';
                  case 1: return 'Ethereum';
                  case 137: return 'Polygon';
                  default: return 'Unknown';
                }
              }

              // Basic HTML escape to avoid accidentally injecting markup via branding fields
              const esc = (v: string) => v
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')


              // Sample comprehensive data including fee computations & status
              const data = {
                chainId: 8453,
                status: 'success',
                txHash: '0x5c3e4b9aa4d2f70e9c1f2b7e8d4f1c2a9b7e6d5c3e4b9aa4d2f70e9c1f2b7e8d',
                sender: '0xA1b2C3d4E5f6978899aBCdef1234567890aBCDeF',
                receiver: '0xfEDcBA0987654321123456789aBCdEf123456789',
                amount: '123.456789',
                token: 'USDT',
              }
              const usdtValue = '123.456789'
              const transactionFeeEth = '0.00012345'
              const transactionFeeUsd = '0.234567'
              const totalWithFeeTokens = '123.456912'
              const totalWithFeeUsd = '123.691356'
              const now = new Date()
              const pad = (n: number) => n.toString().padStart(2, '0')
              const formattedDate = `${now.getUTCFullYear()}-${pad(now.getUTCMonth()+1)}-${pad(now.getUTCDate())}`
              const formattedTime = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`
              const currentDate = formattedDate
              const explorerUrl = `https://basescan.org/tx/${data.txHash.slice(0,66)}...`
              // Tiny placeholder transparent QR (so layout stable). A real one will be injected server-side.
              const qrCodeDataUrl = '/qr.png'
              const isShowingBranding = !!(branding.logoDataUrl || branding.companyName || branding.website)
              const brandingBlock = `
                <div style="text-align:center;margin-bottom:10px;">
                  <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                   ${branding.logoDataUrl ? `<img src="${branding.logoDataUrl}" alt="logo" style="max-width:25px;max-height:25px;object-fit:contain;" />` : ''}
                    <div style="font-weight:bold;font-size:16px;letter-spacing:0.5px;">${esc(branding.companyName)}</div>
                  </div>
                  <div style="font-size:10px;color:#666;margin-top:4px;">${esc(branding.website)}</div>
                </div>`

              // Build static details; only ERC20 section is toggled
              const erc20Section = showDetails ? `
              <div class='divider'></div>
              <div class='section'>
                <div class='section-header'>ERC20 TRANSFERS (LOGS):</div>
                <table class='table'>
                  <thead>
                    <tr>
                      <th class='number'>#</th>
                      <th>FROM</th>
                      <th>TO</th>
                      <th class='amount'>AMOUNT</th>
                      <th class='amount'>CONTRACT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class='number'>0</td>
                      <td class='address'>${data.sender}</td>
                      <td class='address'>${data.receiver}</td>
                      <td class='amount'>${data.amount} ${data.token}</td>
                      <td class='amount'>0xTOKENCONTRACT...</td>
                    </tr>
                  </tbody>
                </table>
              </div>` : ''

              const detailsHtml = `
              <div class='divider'></div>
              <div class='section-status'><div class='section-header'>TRANSACTION IDENTIFIER:</div><div class='hash-value'>${data.txHash}</div></div>
              <div class='divider'></div>
              <div class='section-status'><div class='section-header'>STATUS:</div><div class='hash-value' style='color:${data.status==='success' ? '#00a186' : data.status==='reverted' ? '#f56565' : '#f6ad55'};font-weight:bold;'>${data.status.toUpperCase()}</div></div>
              <div class='divider'></div>
              <div class='info-row'><div class='info-label'>TRANSACTION TIMESTAMP:</div><div class='info-value'><div><strong>CONFIRMED TRANSACTION:</strong></div><div>${formattedDate} ${formattedTime} (UTC)</div><div>Included in block: <strong>#${Math.floor(Math.random()*800000)+700000}</strong> on the <strong>${getNetworkName(data.chainId)}</strong> blockchain</div></div></div>
              <div class='divider'></div>
              <div class='section'><div class='section-header'>SENDERS (INPUTS):</div><table class='table'><thead><tr><th class='number'>#</th><th>SENDER</th><th class='amount'>VALUE (${data.token})</th><th class='amount'>VALUE (USD)</th></tr></thead><tbody>
              <tr><td class='number'>0</td><td class='address'>${data.sender}</td><td class='amount'>${data.amount}</td><td class='amount'>${usdtValue}</td></tr>
              <tr><td class='number'>1</td><td><strong>Network Fee</strong></td><td class='amount'>${transactionFeeEth}</td><td class='amount'>${transactionFeeUsd}</td></tr>
              <tr class='total-row'><td></td><td><strong>TOTAL:</strong></td><td class='amount'><strong>${totalWithFeeTokens} ${data.token}</strong></td><td class='amount'><strong>${totalWithFeeUsd} USDT</strong></td></tr>
              </tbody></table></div>
              <div class='divider'></div>
              <div class='section'><div class='section-header'>RECIPIENTS (OUTPUTS):</div><table class='table'><thead><tr><th class='number'>#</th><th>RECIPIENT</th><th class='amount'>VALUE (${data.token})</th><th class='amount'>VALUE (USD)</th></tr></thead><tbody>
              <tr><td class='number'>1</td><td class='address'>${data.receiver}</td><td class='amount'>${data.amount}</td><td class='amount'>${usdtValue}</td></tr>
              <tr><td style='border-top:1px solid #000;'>→</td><td style='border-top:1px solid #000;'><strong>TOTAL:</strong></td><td class='amount' style='border-top:1px solid #000;'><strong>${data.amount} ${data.token}</strong></td><td class='amount' style='border-top:1px solid #000;'><strong>${usdtValue} USDT</strong></td></tr>
              </tbody></table></div>
              ${erc20Section}
              <div class='divider'></div>
              <div class='qr-section'><div class='qr-left'><div class='section-header'>NOTE</div><div class='note'>${data.token}-USD RATE AT THE TIME OF TRANSACTION.<br>ONLY LAYER BALANCES ARE NOT INCLUDED IN THIS REPORT.</div><div class='section-header' style='margin-top:20px;'>DISCLAIMER</div><div class='disclaimer'>THIS RECEIPT WAS GENERATED AUTOMATICALLY ON <strong>${currentDate} (UTC)</strong> AND IS BASED ON PUBLIC DATA FROM THE <strong>${getNetworkName(data.chainId)}</strong> BLOCKCHAIN. TRANSACTPROOF MAKES NEITHER WARRANTY THAT THIS RECEIPT IS FREE OF ERRORS, NOR WARRANTY THAT ITS CONTENT IS ACCURATE. TRANSACTPROOF WILL NOT BE RESPONSIBLE OR LIABLE TO YOU FOR ANY LOSS OF ANY KIND, FOR ACTION TAKEN, OR TAKEN IN RELIANCE ON INFORMATION CONTAINED IN THIS RECEIPT. TRANSACTPROOF IS NEITHER A BANK, NOR A PAYMENT PROCESSOR FOR THIS PAYMENT. TRANSACTPROOF DOES NOT PROVIDE SUPPORT IN CASE OF PROBLEMS ASSOCIATED WITH THIS RECEIPT.</div></div><div class='qr-right'>${qrCodeDataUrl ? `<img src='${qrCodeDataUrl}' alt='Verification QR Code' width='120' height='120' class='qr-code'/>` : ''}<div style='margin-top:10px;font-size:9px;max-width:120px;'><strong>Scan to check the validity of the transaction at</strong><br><span class='verification-url'>${explorerUrl.replace('https://','')}</span></div></div></div>
              `

              // Construct full HTML (mirrors server template; trimmed branding injection & dynamic bits)
              const fullTemplateHtml = `<!DOCTYPE html><html><head><meta charset='utf-8'/><style>
                *{margin:0;padding:0;box-sizing:border-box;} body{font-family:'Courier New',monospace;line-height:1.4;color:#000;background:#fff;font-size:12px;} .container{max-width:800px;margin:0 auto;padding:20px;}
                .header{text-align:center;margin-bottom:15px;} .logo{display:flex;justify-content:center;align-items:center;gap:10px;font-size:24px;font-weight:bold;margin-bottom:10px;}
                .website{font-size:10px;color:#666;margin-bottom:20px;} .divider{border-top:1px dotted #000;margin:15px 0;} .title{text-align:center;font-size:16px;font-weight:bold;margin:15px 0;text-transform:uppercase;}
                .section{margin-bottom:20px;} .section-status{display:flex;justify-content:space-between;align-items:flex-start;} .section-header{font-weight:bold;text-transform:uppercase;}
                .info-row{display:flex;justify-content:space-between;margin-bottom:5px;align-items:flex-start;} .info-label{font-weight:bold;min-width:200px;} .info-value{text-align:right;word-break:break-all;flex:1;margin-left:20px;}
                .hash-value{font-size:10px;word-break:break-all;max-width:400px;} .table{width:100%;border-collapse:collapse;margin:15px 0;}
                .table th,.table td{padding:8px;text-align:left;border-bottom:1px solid #ddd;font-size:10px;} .table th{background:#f5f5f5;font-weight:bold;text-transform:uppercase;}
                .table .number{text-align:center;width:30px;} .table .address{font-family:'Courier New',monospace;font-size:9px;word-break:break-all;max-width:250px;} .table .amount{text-align:right;font-weight:bold;}
                .total-row{font-weight:bold;background:#f9f9f9;} .miner-fee{font-style:italic;color:#666;} .qr-section{display:flex;align-items:flex-start;margin:20px 0;}
                .qr-left{flex:1;} .qr-right{text-align:center;margin-left:20px;} .qr-code{border:1px solid #000;} .note{font-size:10px;color:#666;margin:20px 0;line-height:1.3;}
                .footer{text-align:center;font-size:10px;color:#666;} .disclaimer{background:#f9f9f9;padding:10px;border:1px solid #ddd;margin:20px 0;font-size:9px;line-height:1.3;}
                .verification-url{font-size:9px;word-break:break-all;}
              </style></head><body><div class='container'>${brandingBlock}
              ${isShowingBranding ? '<div class=\'divider\'></div>' : ''}
              <div class='title'>TRANSACTION RECEIPT</div>
              <div class='divider'></div>
              <div class='section-status'><div class='section-header'>CHAIN:</div><div class='hash-value'>${getNetworkName(data.chainId)}</div></div>
              ${detailsHtml}
              <div class='footer'><div><strong>TransactProof Receipt Generation System</strong></div><div>Blockchain Transaction Verification Service</div><div>https://transactproof.com</div></div>
              </div></body></html>`

              return (
                <div className='border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden'>
                  <div className='text-[10px] text-gray-500 flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
                    <span>Full layout approximation (client preview)</span>
                    <span className='italic'>Server-generated PDF may vary slightly</span>
                  </div>
                  {/* sandbox intentionally excludes scripts for safety; warning in console is expected due to disallowed script execution */}
                  <iframe
                    title='Full PDF Template Preview'
                    style={{ width: '100%', height: 640, border: '0', background: 'white' }}
                    sandbox='allow-same-origin'
                    srcDoc={fullTemplateHtml}
                  />
                </div>
              )
            })()}
            {!mounted && (
              <div className='border border-gray-300 dark:border-gray-700 bg-white/40 dark:bg-gray-900/40 overflow-hidden h-[680px] flex items-center justify-center text-[10px] text-gray-500'>
                Preparing preview...
              </div>
            )}
          </MotionDiv>
        </div>
      </div>
    </section>
  )
}
