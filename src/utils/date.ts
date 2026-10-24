/**
 * Formats an ISO date or YYYY-MM-DD string into a readable Indian date format: e.g. "26 Oct 2026"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns today's date in YYYY-MM-DD format for input[type="date"]
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the most recent Saturday in YYYY-MM-DD format for trip expense dates.
 */
export function getLatestSaturdayDateString(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Number of days to subtract to reach the most recent Saturday
  const diff = (day + 1) % 7;
  d.setDate(d.getDate() - diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dateNum = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dateNum}`;
}

/**
 * Formats a date with time: e.g. "26 Oct 2026, 04:30 PM"
 */
export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
