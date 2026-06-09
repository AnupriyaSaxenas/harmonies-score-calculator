import { useState } from 'react'
import DropZone from './components/DropZone'
import Results from './components/Results'
import { SYSTEM_PROMPT } from './prompt'

const ANIMAL_SLOTS = ['animal1', 'animal2', 'animal3', 'animal4']

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function App() {
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [boardSide, setBoardSide] = useState('A')
  const [files, setFiles]         = useState({})
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [results, setResults]     = useState(null)

  function setFile(key, file) {
    setFiles(prev => ({ ...prev, [key]: file }))
  }

  async function calculate() {
    if (!apiKey.trim()) { setError('Please enter your OpenRouter API key.'); return }
    if (!files.board)   { setError('Please upload at least your board photo.'); return }

    setError('')
    setLoading(true)
    setResults(null)

    try {
      const content = []

      const animalCount = ANIMAL_SLOTS.filter(k => files[k]).length
      content.push({
        type: 'text',
        text: `Please score this Harmonies board.\n• Board side: ${boardSide === 'A' ? 'Side A (River)' : 'Side B (Islands)'}\n• Animal cards: ${animalCount}\n• Nature's Spirit: ${files.spirit ? 'yes' : 'no'}`,
      })

      const boardB64 = await toBase64(files.board)
      content.push({ type: 'image_url', image_url: { url: `data:${files.board.type || 'image/jpeg'};base64,${boardB64}` } })

      for (const key of ANIMAL_SLOTS) {
        if (files[key]) {
          const b64 = await toBase64(files[key])
          content.push({ type: 'image_url', image_url: { url: `data:${files[key].type || 'image/jpeg'};base64,${b64}` } })
        }
      }

      if (files.spirit) {
        const b64 = await toBase64(files.spirit)
        content.push({ type: 'image_url', image_url: { url: `data:${files.spirit.type || 'image/jpeg'};base64,${b64}` } })
      }

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-4-31b-it:free',
          max_tokens: 4096,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content },
          ],
        }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err?.error?.message || `API error ${resp.status}`)
      }

      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content || ''
      setResults({ text, boardSide })
    } catch (e) {
      setError('Error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return <Results data={results} onReset={() => setResults(null)} />
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>🌿 Harmonies Score Calculator</h1>
        <p>Upload your board &amp; cards — get your final score instantly</p>
      </header>

      {/* API Key */}
      <section className="card">
        <h2 className="card-title">
          🔑 OpenRouter API Key <span className="badge">stored in memory only</span>
        </h2>
        <div className="key-row">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="key-input"
            autoComplete="off"
          />
          <button className="toggle-btn" onClick={() => setShowKey(s => !s)}>
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="hint">
          Your key is never stored — it lives only in this browser tab and is sent directly to OpenRouter. Get a free key at openrouter.ai/keys.
        </p>
      </section>

      {/* Board Side */}
      <section className="card">
        <h2 className="card-title">🗺 Board Side</h2>
        <div className="side-selector">
          {[
            { side: 'A', title: 'Side A — River',   desc: 'Blue tokens form a river. Only your best river scores.' },
            { side: 'B', title: 'Side B — Islands',  desc: 'Blue tokens divide land. Each island = 5 pts.' },
          ].map(({ side, title, desc }) => (
            <button
              key={side}
              className={`side-option${boardSide === side ? ' selected' : ''}`}
              onClick={() => setBoardSide(side)}
            >
              <strong>{title}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Board image */}
      <section className="card">
        <h2 className="card-title">📸 Board Image <span className="badge">required</span></h2>
        <DropZone
          label="Click or drag your personal board photo"
          subLabel="Best when taken from above, all hexes visible"
          icon="🎮"
          file={files.board}
          onChange={f => setFile('board', f)}
          onRemove={() => setFile('board', null)}
          wide
        />
      </section>

      {/* Animal cards */}
      <section className="card">
        <h2 className="card-title">🐾 Animal Cards <span className="badge">up to 4 + completed</span></h2>
        <p className="hint" style={{ marginBottom: 12 }}>
          Include both active cards above your board AND completed cards placed beside it.
        </p>
        <div className="upload-grid">
          {ANIMAL_SLOTS.map((key, i) => (
            <DropZone
              key={key}
              label={`Animal Card ${i + 1}`}
              subLabel="optional"
              icon="🐾"
              file={files[key]}
              onChange={f => setFile(key, f)}
              onRemove={() => setFile(key, null)}
            />
          ))}
        </div>
      </section>

      {/* Nature's Spirit */}
      <section className="card">
        <h2 className="card-title">✨ Nature's Spirit Card <span className="badge">optional</span></h2>
        <DropZone
          label="Nature's Spirit card"
          subLabel="Skip if not using"
          icon="🌟"
          file={files.spirit}
          onChange={f => setFile('spirit', f)}
          onRemove={() => setFile('spirit', null)}
        />
      </section>

      <button className="calc-btn" onClick={calculate} disabled={loading}>
        {loading ? (
          <><span className="btn-spinner" /> Analysing…</>
        ) : (
          <><span>🧮</span> Calculate My Score</>
        )}
      </button>

      {error && <div className="error-box">{error}</div>}
    </div>
  )
}
