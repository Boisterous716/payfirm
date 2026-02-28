import { describe, it, expect } from 'vitest'
import { matchAndAggregate } from '../matchAndAggregate'
import type { CsvRow, PaymentEntry } from '../../../types'

const CSV: CsvRow[] = [
  { reddit_username: 'johndoe', full_name: 'John Doe' },
  { reddit_username: 'janesmith', full_name: 'Jane Smith' },
  { reddit_username: 'boblee', full_name: 'Bob Lee' },
]

function payment(payerName: string, amount: number, platform: PaymentEntry['platform'] = 'paypal'): PaymentEntry {
  return { payerName, amount, timestamp: '2026-02-22T01:00:00.000Z', platform }
}

describe('matchAndAggregate', () => {
  describe('name matching', () => {
    it('matches exact name', () => {
      const { results } = matchAndAggregate([payment('John Doe', 20)], CSV)
      expect(results[0].reddit_username).toBe('johndoe')
    })

    it('matches case-insensitively', () => {
      const { results } = matchAndAggregate([payment('john doe', 20)], CSV)
      expect(results[0].reddit_username).toBe('johndoe')
    })

    it('matches reversed name (Last First)', () => {
      const { results } = matchAndAggregate([payment('Doe John', 20)], CSV)
      expect(results[0].reddit_username).toBe('johndoe')
    })

    it('matches when payer name contains first and last as substrings', () => {
      const { results } = matchAndAggregate([payment('John A. Doe', 20)], CSV)
      expect(results[0].reddit_username).toBe('johndoe')
    })

    it('does not match a partial name with only first name', () => {
      const { unmatched } = matchAndAggregate([payment('John', 20)], CSV)
      expect(unmatched).toContain('John')
    })

    it('adds unrecognised payer to unmatched list', () => {
      const { results, unmatched } = matchAndAggregate([payment('Unknown Person', 20)], CSV)
      expect(results).toHaveLength(0)
      expect(unmatched).toContain('Unknown Person')
    })

    it('deduplicates unmatched names across multiple payments', () => {
      const payments = [payment('Ghost User', 10), payment('Ghost User', 15)]
      const { unmatched } = matchAndAggregate(payments, CSV)
      expect(unmatched.filter((n) => n === 'Ghost User')).toHaveLength(1)
    })
  })

  describe('aggregation', () => {
    it('sums amounts from the same payer', () => {
      const payments = [payment('John Doe', 20), payment('John Doe', 15)]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results[0].total_amount_usd).toBe(35)
    })

    it('counts individual payments', () => {
      const payments = [payment('John Doe', 20), payment('John Doe', 15)]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results[0].payment_count).toBe(2)
    })

    it('rounds totals to two decimal places', () => {
      const payments = [payment('John Doe', 10.5), payment('John Doe', 10.5)]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results[0].total_amount_usd).toBe(21)
    })

    it('sorts results by total descending', () => {
      const payments = [
        payment('Jane Smith', 10),
        payment('John Doe', 50),
        payment('Bob Lee', 30),
      ]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results.map((r) => r.reddit_username)).toEqual(['johndoe', 'boblee', 'janesmith'])
    })

    it('keeps separate totals per person', () => {
      const payments = [payment('John Doe', 20), payment('Jane Smith', 40)]
      const { results } = matchAndAggregate(payments, CSV)
      const john = results.find((r) => r.reddit_username === 'johndoe')
      const jane = results.find((r) => r.reddit_username === 'janesmith')
      expect(john?.total_amount_usd).toBe(20)
      expect(jane?.total_amount_usd).toBe(40)
    })
  })

  describe('platform tracking', () => {
    it('records the platform on first payment', () => {
      const { results } = matchAndAggregate([payment('John Doe', 20, 'paypal')], CSV)
      expect(results[0].platforms).toEqual(['paypal'])
    })

    it('records multiple platforms for the same person', () => {
      const payments = [payment('John Doe', 20, 'paypal'), payment('John Doe', 15, 'venmo')]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results[0].platforms).toEqual(['paypal', 'venmo'])
    })

    it('deduplicates platforms', () => {
      const payments = [payment('John Doe', 20, 'paypal'), payment('John Doe', 15, 'paypal')]
      const { results } = matchAndAggregate(payments, CSV)
      expect(results[0].platforms).toEqual(['paypal'])
    })
  })
})
