import type { MatchedResult, PaymentPlatform } from '../../types'

const PLATFORM_LABELS: Record<PaymentPlatform, string> = {
  paypal: 'PayPal',
  venmo: 'Venmo',
  wise: 'Wise',
}

function formatPlatforms(platforms: PaymentPlatform[]): string {
  return platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(', ')
}

interface Props {
  results: MatchedResult[]
}

export function ResultsTable({ results }: Props) {
  if (results.length === 0) {
    return <p className="empty">No matched payments found.</p>
  }

  const totalAmount = results.reduce((sum, r) => sum + r.total_amount_usd, 0)
  const totalPayments = results.reduce((sum, r) => sum + r.payment_count, 0)

  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Reddit User</th>
          <th>Name</th>
          <th>Platform</th>
          <th>Total (USD)</th>
          <th>Payments</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r) => (
          <tr key={r.reddit_username}>
            <td>u/{r.reddit_username}</td>
            <td>{r.full_name}</td>
            <td>{formatPlatforms(r.platforms)}</td>
            <td>${r.total_amount_usd.toFixed(2)}</td>
            <td>{r.payment_count}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="total-row">
          <td colSpan={3}>Total</td>
          <td>${(Math.round(totalAmount * 100) / 100).toFixed(2)}</td>
          <td>{totalPayments}</td>
        </tr>
      </tfoot>
    </table>
  )
}
