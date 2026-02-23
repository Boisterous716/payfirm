import type { CsvRow, PaymentEntry, MatchedResult, PaymentPlatform } from '../../types'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchName(payerName: string, csvRow: CsvRow): boolean {
  const payer = normalize(payerName)
  const full = normalize(csvRow.full_name)

  if (!payer || !full) return false

  const parts = full.split(' ')
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''

  // Strategy 1: exact match "John Smith"
  if (payer === full) return true

  // Strategy 2: reversed "Smith John"
  if (parts.length >= 2 && payer === `${last} ${first}`) return true

  // Strategy 3: payer contains both first and last as substrings
  if (first && last && first !== last && payer.includes(first) && payer.includes(last)) return true

  return false
}

export interface AggregateResult {
  results: MatchedResult[]
  unmatched: string[]
}

export function matchAndAggregate(payments: PaymentEntry[], csvRows: CsvRow[]): AggregateResult {
  const accumulator = new Map<string, MatchedResult>()
  const unmatched: string[] = []

  for (const payment of payments) {
    const csvRow = csvRows.find((row) => matchName(payment.payerName, row))

    if (csvRow) {
      const existing = accumulator.get(csvRow.reddit_username)
      if (existing) {
        existing.total_amount_usd = Math.round((existing.total_amount_usd + payment.amount) * 100) / 100
        existing.payment_count++
        if (!existing.platforms.includes(payment.platform)) {
          existing.platforms.push(payment.platform)
        }
      } else {
        accumulator.set(csvRow.reddit_username, {
          reddit_username: csvRow.reddit_username,
          full_name: csvRow.full_name,
          total_amount_usd: Math.round(payment.amount * 100) / 100,
          payment_count: 1,
          platforms: [payment.platform],
        })
      }
    } else {
      if (!unmatched.includes(payment.payerName)) {
        unmatched.push(payment.payerName)
      }
    }
  }

  const results = Array.from(accumulator.values()).sort(
    (a, b) => b.total_amount_usd - a.total_amount_usd
  )

  return { results, unmatched }
}
