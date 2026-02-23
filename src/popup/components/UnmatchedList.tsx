interface Props {
  names: string[]
}

export function UnmatchedList({ names }: Props) {
  if (names.length === 0) return null

  return (
    <div className="unmatched">
      <h3>Unmatched Payers ({names.length})</h3>
      <p className="hint">These names weren&apos;t found in your CSV. Update the CSV to match them.</p>
      <ul>
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  )
}
