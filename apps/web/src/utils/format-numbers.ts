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
  return value?.toFixed(decimals).replace(/\.?0+$/, '')
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

 // Helper: deterministic discount formatting (always floors half-cent cases)
// Works fully in integer space to avoid IEEE-754 surprises.
// If amount=9.99 and discount=0.5 -> 9.99 => 999 cents; 999 * 0.5 = 499.5 => floor => 499 => 4.99
export const formatDiscount = (amount: number, discount?: number | null) => {
  if (!discount) return 0
  // Convert to integer cents with rounding to nearest cent first (so 9.999 becomes 1000)
  const cents = Math.round(amount * 100)
  // Represent discount as a rational over 1e6 to preserve up to 6 decimal digits in factor
  const discountFactor = Math.round(discount * 1_000_000) // e.g. 0.5 -> 500000
  // Multiply then floor back to cents; add big denominator - 1 then integer divide to floor
  const discountedCents = Math.floor((cents * discountFactor) / 1_000_000)
  return +(discountedCents / 100).toFixed(2)
}