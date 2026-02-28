import { useRef } from 'react'
import { parseCsv } from '../utils/parseCsv'
import { saveCsvCache } from '../utils/csvCache'
import type { CsvRow } from '../../types'

interface Props {
  onLoad: (rows: CsvRow[], fileName: string) => void
  onError: (msg: string) => void
}

export function CsvUploader({ onLoad, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const rows = parseCsv(text)
        await saveCsvCache(rows, file.name)
        onLoad(rows, file.name)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to parse CSV')
      }
    }
    reader.readAsText(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="uploader">
      <label className="upload-btn">
        Upload CSV
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      </label>
      <p className="hint">CSV must have columns: <code>reddit_username</code>, <code>full_name</code></p>
    </div>
  )
}
