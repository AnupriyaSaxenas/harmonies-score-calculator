function parseScores(text) {
  const match = text.match(/---SCORE BREAKDOWN---([\s\S]*?)---END BREAKDOWN---/)
  if (!match) return null
  const block = match[1]
  const extract = label => {
    const re = new RegExp(label + '\\s*:\\s*\\[?(\\d+)\\]?\\s*pts', 'i')
    const m = block.match(re)
    return m ? parseInt(m[1], 10) : null
  }
  return {
    trees:     extract('Trees'),
    mountains: extract('Mountains'),
    fields:    extract('Fields'),
    buildings: extract('Buildings'),
    water:     extract('Water'),
    landscape: extract('Landscape Total'),
    animals:   extract('Animal Cards'),
    spirit:    extract("Nature's Spirit"),
    total:     extract('GRAND TOTAL'),
  }
}

const SCORE_ITEMS = [
  { icon: '🌲', label: 'Trees',      key: 'trees' },
  { icon: '⛰️', label: 'Mountains',  key: 'mountains' },
  { icon: '🌾', label: 'Fields',     key: 'fields' },
  { icon: '🏠', label: 'Buildings',  key: 'buildings' },
  { icon: '💧', label: 'Water',      key: 'water' },
  { icon: '🐾', label: 'Animals',    key: 'animals' },
  { icon: '✨', label: "Nature's Spirit", key: 'spirit' },
]

export default function Results({ data, onReset }) {
  const { text, boardSide } = data
  const scores = parseScores(text)
  const cleanText = text.replace(/---SCORE BREAKDOWN---[\s\S]*?---END BREAKDOWN---/, '').trim()

  const waterItem = SCORE_ITEMS.find(i => i.key === 'water')
  if (waterItem) waterItem.label = `Water (Side ${boardSide})`

  const subParts = [
    scores?.landscape != null && `Landscape: ${scores.landscape} pts`,
    scores?.animals   != null && `Animals: ${scores.animals} pts`,
    scores?.spirit        && `Spirit: ${scores.spirit} pts`,
  ].filter(Boolean)

  return (
    <div className="container">
      <header className="app-header">
        <h1>🌿 Harmonies Score Calculator</h1>
      </header>

      <div className="score-hero">
        <div className="total-label">Final Score</div>
        <div className="total-number">{scores?.total ?? '?'}</div>
        {subParts.length > 0 && (
          <div className="score-sub">{subParts.join('  ·  ')}</div>
        )}
      </div>

      {scores && (
        <div className="score-grid">
          {SCORE_ITEMS.map(({ icon, label, key }) => (
            <div key={key} className="score-item">
              <div className="si-label">{icon} {label}</div>
              <div className="si-value">{scores[key] != null ? scores[key] : '—'}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Full Analysis</h2>
        <pre className="analysis-box">{cleanText}</pre>
      </div>

      <button className="calc-btn secondary" onClick={onReset}>
        ← Calculate Again
      </button>
    </div>
  )
}
