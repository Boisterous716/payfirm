import type { MatchedResult } from '../../types'

function quoteCell(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const PLATFORM_LABELS: Record<string, string> = {
  paypal: 'PayPal',
  venmo: 'Venmo',
  wise: 'Wise',
}

export function buildCsvString(results: MatchedResult[]): string {
  const header = ['reddit_username', 'full_name', 'platforms', 'total_amount_usd', 'payment_count']
  const rows = results.map((r) => [
    quoteCell(r.reddit_username),
    quoteCell(r.full_name),
    quoteCell(r.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(', ')),
    quoteCell(r.total_amount_usd.toFixed(2)),
    quoteCell(r.payment_count),
  ])
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
}

export function exportResultsCsv(results: MatchedResult[]): void {
  const csv = buildCsvString(results)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)

  const a = document.createElement('a')
  a.href = url
  a.download = `payfirm-results-${date}.csv`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
