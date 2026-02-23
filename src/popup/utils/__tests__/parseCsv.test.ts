import { describe, it, expect } from 'vitest'
import { parseCsv } from '../parseCsv'

describe('parseCsv', () => {
  it('parses a basic CSV with standard column names', () => {
    const csv = 'reddit_username,full_name\njohndoe,John Doe\njanedoe,Jane Doe'
    expect(parseCsv(csv)).toEqual([
      { reddit_username: 'johndoe', full_name: 'John Doe' },
      { reddit_username: 'janedoe', full_name: 'Jane Doe' },
    ])
  })

  it('accepts "username" as alias for "reddit_username"', () => {
    const csv = 'username,full_name\njohndoe,John Doe'
    expect(parseCsv(csv)).toEqual([{ reddit_username: 'johndoe', full_name: 'John Doe' }])
  })

  it('accepts "name" as alias for "full_name"', () => {
    const csv = 'reddit_username,name\njohndoe,John Doe'
    expect(parseCsv(csv)).toEqual([{ reddit_username: 'johndoe', full_name: 'John Doe' }])
  })

  it('normalises headers (uppercase, extra spaces)', () => {
    const csv = 'Reddit_Username,Full_Name\njohndoe,John Doe'
    expect(parseCsv(csv)).toHaveLength(1)
    expect(parseCsv(csv)[0].reddit_username).toBe('johndoe')
  })

  it('trims whitespace from values', () => {
    const csv = 'reddit_username,full_name\n  johndoe  ,  John Doe  '
    expect(parseCsv(csv)[0]).toEqual({ reddit_username: 'johndoe', full_name: 'John Doe' })
  })

  it('skips rows where username or name is empty', () => {
    const csv = 'reddit_username,full_name\njohndoe,John Doe\n,Jane Doe\njanedoe,'
    expect(parseCsv(csv)).toHaveLength(1)
  })

  it('handles quoted fields containing commas', () => {
    const csv = 'reddit_username,full_name\njohndoe,"Doe, John"'
    expect(parseCsv(csv)[0].full_name).toBe('Doe, John')
  })

  it('throws when required columns are missing', () => {
    expect(() => parseCsv('foo,bar\na,b')).toThrow()
  })

  it('throws when no valid rows are found', () => {
    expect(() => parseCsv('reddit_username,full_name\n,')).toThrow()
  })
})
