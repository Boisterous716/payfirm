export interface CsvRow {
  reddit_username: string
  full_name: string
}

export type PaymentPlatform = 'paypal' | 'venmo' | 'wise'

export interface PaymentEntry {
  payerName: string
  amount: number
  timestamp: string
  platform: PaymentPlatform
}

export interface MatchedResult {
  reddit_username: string
  full_name: string
  total_amount_usd: number
  payment_count: number
  platforms: PaymentPlatform[]   // deduplicated list of platforms used by this person
}
