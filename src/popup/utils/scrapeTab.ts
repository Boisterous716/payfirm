import type { PaymentEntry, PaymentPlatform } from '../../types'

// Self-contained function injected into the page via chrome.scripting.executeScript.
// No imports, no closures — must be fully serializable.
async function _scrapeGmailPayments(
  autoScroll: boolean,
  fromISO: string,
  toISO: string
): Promise<Array<{ payerName: string; amount: number; timestamp: string; platform: string }>> {
  const ROW_SEL = 'tr:has(span[email])'
  const SENDER_SEL = 'span[email]'
  const SUBJECT_SEL = 'span.bqe, span.bog'
  const TIME_SEL = 'td.xW span[title]'

  const fromMs = fromISO ? new Date(fromISO).getTime() : 0
  const toMs = toISO ? new Date(toISO).getTime() : Infinity

  // ── PayPal ──────────────────────────────────────────────────────────────────
  // Email: service@paypal.com
  // Subject: "John Apple sent you $20.00 USD"
  function tryPayPal(subject: string): { payerName: string; amount: number } | null {
    const m = /^(.+?)\s+sent\s+you\s+\$([0-9,]+(?:\.\d+)?)\s*USD/i.exec(subject)
    if (!m) return null
    return { payerName: m[1].trim(), amount: parseFloat(m[2].replace(/,/g, '')) }
  }

  // ── Venmo ───────────────────────────────────────────────────────────────────
  // Email: venmo@venmo.com
  // Subject (common formats):
  //   "John Doe paid you $20.00"
  //   "John Doe sent you $20.00"
  // TODO: paste a Venmo email row HTML to confirm selectors & exact subject format
  function tryVenmo(subject: string): { payerName: string; amount: number } | null {
    const m = /^(.+?)\s+(?:paid|sent)\s+you\s+\$([0-9,]+(?:\.\d+)?)/i.exec(subject)
    if (!m) return null
    return { payerName: m[1].trim(), amount: parseFloat(m[2].replace(/,/g, '')) }
  }

  // ── Wise ────────────────────────────────────────────────────────────────────
  // Email: no-reply@wise.com
  // Subject (common formats):
  //   "You've received USD 20.00 from John Doe"
  //   "John Doe sent you USD 20.00"
  // TODO: paste a Wise email row HTML to confirm selectors & exact subject format
  function tryWise(subject: string): { payerName: string; amount: number } | null {
    const received = /you(?:'ve)?\s+received\s+[A-Z]{3}\s*([0-9,]+(?:\.\d+)?)\s+from\s+(.+)/i.exec(subject)
    if (received) return { payerName: received[2].trim(), amount: parseFloat(received[1].replace(/,/g, '')) }

    const sent = /^(.+?)\s+sent\s+you\s+[A-Z]{3}\s*([0-9,]+(?:\.\d+)?)/i.exec(subject)
    if (sent) return { payerName: sent[1].trim(), amount: parseFloat(sent[2].replace(/,/g, '')) }

    return null
  }

  type ParseResult = { payerName: string; amount: number; platform: string } | null

  function detectAndParse(senderEmail: string, subject: string): ParseResult {
    if (senderEmail.includes('paypal')) {
      const r = tryPayPal(subject)
      return r ? { ...r, platform: 'paypal' } : null
    }
    if (senderEmail.includes('venmo')) {
      const r = tryVenmo(subject)
      return r ? { ...r, platform: 'venmo' } : null
    }
    if (senderEmail.includes('wise') || senderEmail.includes('transferwise')) {
      const r = tryWise(subject)
      return r ? { ...r, platform: 'wise' } : null
    }
    return null
  }

  function scrapeRows(): Array<{ payerName: string; amount: number; timestamp: string; platform: string }> {
    const rows = Array.from(document.querySelectorAll(ROW_SEL))
    const payments: Array<{ payerName: string; amount: number; timestamp: string; platform: string }> = []
    const seen = new Set<string>()

    for (const row of rows) {
      const senderEl = row.querySelector(SENDER_SEL)
      const senderEmail = (senderEl?.getAttribute('email') ?? '').toLowerCase()

      const subjectEl = row.querySelector(SUBJECT_SEL)
      const subject = subjectEl?.textContent?.trim() ?? ''

      const parsed = detectAndParse(senderEmail, subject)
      if (!parsed || parsed.amount <= 0) continue

      const timeEl = row.querySelector(TIME_SEL)
      const titleAttr = timeEl?.getAttribute('title') ?? ''
      const parsedDate = titleAttr ? new Date(titleAttr) : null
      const timestamp = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : ''

      if (timestamp) {
        const ms = parsedDate!.getTime()
        if (ms < fromMs || ms > toMs) continue
      }

      const key = `${parsed.platform}|${parsed.payerName}|${parsed.amount}|${timestamp}`
      if (seen.has(key)) continue
      seen.add(key)

      payments.push({ ...parsed, timestamp })
    }

    return payments
  }

  async function waitForRows(): Promise<Array<{ payerName: string; amount: number; timestamp: string; platform: string }>> {
    const existing = scrapeRows()
    if (existing.length > 0) return existing

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        observer.disconnect()
        resolve(scrapeRows())
      }, 3000)

      const observer = new MutationObserver(() => {
        const rows = scrapeRows()
        if (rows.length > 0) {
          clearTimeout(timer)
          observer.disconnect()
          resolve(rows)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    })
  }

  if (autoScroll) {
    let lastCount = 0
    let stableRounds = 0
    while (stableRounds < 2) {
      window.scrollTo(0, document.body.scrollHeight)
      await new Promise((r) => setTimeout(r, 1500))
      const rows = scrapeRows()
      if (rows.length === lastCount) stableRounds++
      else { stableRounds = 0; lastCount = rows.length }
    }
    return scrapeRows()
  }

  return waitForRows()
}

export async function scrapeTab(
  tabId: number,
  autoScroll: boolean,
  fromISO: string,
  toISO: string
): Promise<PaymentEntry[]> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: _scrapeGmailPayments,
    args: [autoScroll, fromISO, toISO],
  })

  const data = results[0]?.result
  if (!data) throw new Error('Scraping returned no data.')
  return data as PaymentEntry[]
}
