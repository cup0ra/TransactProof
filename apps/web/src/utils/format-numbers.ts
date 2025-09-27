/**
 * Format a number for display, avoiding scientific notation for small numbers
 */
export function formatNumber(value: number, decimals: number = 6): string {
  if (value === 0) return '0'
  
  // For very small numbers, use fixed notation to avoid scientific notation
  if (value < 0.000001) {
    // Find the appropriate number of decimals to show the value clearly
    const str = value.toFixed(10)
    // Remove trailing zeros
    return str.replace(/\.?0+$/, '')
  }
  
  // For normal numbers, use the specified decimals
  return value.toFixed(decimals).replace(/\.?0+$/, '')
}

/**
 * Format payment amount consistently
 */
export function formatPaymentAmountDisplay(amount: number): string {
  return formatNumber(amount, 7)
}

/**
 * Format balance display with appropriate decimals
 */
export function formatBalanceDisplay(balance: string | number, isETH: boolean = false): string {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance
  return formatNumber(numBalance, isETH ? 8 : 6)
}