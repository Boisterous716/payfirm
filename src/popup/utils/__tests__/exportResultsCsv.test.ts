import { describe, it, expect } from 'vitest'
import { buildCsvString } from '../exportResultsCsv'
import type { MatchedResult } from '../../../types'

function result(overrides: Partial<MatchedResult> = {}): MatchedResult {
  return {
    reddit_username: 'johndoe',
    full_name: 'John Doe',
    total_amount_usd: 20,
    payment_count: 1,
    platforms: ['paypal'],
    ...overrides,
  }
}

describe('buildCsvString', () => {
  it('includes the correct header row', () => {
    const csv = buildCsvString([])
    expect(csv).toBe('reddit_username,full_name,platforms,total_amount_usd,payment_count')
  })

  it('formats a single result row correctly', () => {
    const csv = buildCsvString([result()])
    const lines = csv.split('\r\n')
    expect(lines[1]).toBe('johndoe,John Doe,PayPal,20.00,1')
  })

  it('formats platform labels (PayPal, Venmo, Wise)', () => {
    const csv = buildCsvString([result({ platforms: ['paypal', 'venmo', 'wise'] })])
    expect(csv).toContain('"PayPal, Venmo, Wise"')
  })

  it('formats amount to two decimal places', () => {
    const csv = buildCsvString([result({ total_amount_usd: 7.5 })])
    expect(csv).toContain('7.50')
  })

  it('quotes cells that contain commas', () => {
    const csv = buildCsvString([result({ full_name: 'Doe, John' })])
    expect(csv).toContain('"Doe, John"')
  })

  it('quotes cells that contain double-quotes (RFC 4180)', () => {
    const csv = buildCsvString([result({ full_name: 'John "JD" Doe' })])
    expect(csv).toContain('"John ""JD"" Doe"')
  })

  it('produces one row per result plus header', () => {
    const csv = buildCsvString([result(), result({ reddit_username: 'janedoe' })])
    expect(csv.split('\r\n')).toHaveLength(3)
  })

  it('uses CRLF line endings (RFC 4180)', () => {
    const csv = buildCsvString([result()])
    expect(csv).toContain('\r\n')
  })
})
