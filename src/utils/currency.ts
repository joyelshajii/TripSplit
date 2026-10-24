/**
 * Converts a rupee amount (number or string like "100.50") into integer paise.
 * Avoids JavaScript floating-point rounding issues by working with decimals carefully.
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const clean = rupees.trim();
    if (!clean) return 0;
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise back to rupees (decimal number).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats integer paise into standard Indian Rupee string: e.g. "₹1,250.00" or "₹1,250".
 * Uses en-IN locale number formatting.
 */
export function formatINR(paise: number, options?: { hideZeroPaise?: boolean }): string {
  const rupees = paise / 100;
  const hasDecimals = paise % 100 !== 0;
  const minDigits = options?.hideZeroPaise && !hasDecimals ? 0 : 2;
  const maxDigits = 2;

  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(rupees);
    return formatted;
  } catch {
    // Fallback if Intl fails
    const fixed = rupees.toFixed(2);
    return `₹${fixed}`;
  }
}

/**
 * Formats a plain number to Indian numbering system (e.g. 1,00,000.00).
 */
export function formatIndianNumber(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}
