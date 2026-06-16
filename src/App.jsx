import { useRef, useState } from 'react'
import DropZone from './components/DropZone'
import Results from './components/Results'
import { SYSTEM_PROMPT } from './prompt'

const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter — free vision models',
    model: 'google/gemma-4-31b-it:free',
    placeholder: 'sk-or-v1-...',
    keyHelp: 'Get a free key at openrouter.ai/keys',
  },
  openai: {
    label: 'OpenAI — GPT-4o (paid)',
    model: 'gpt-4o',
    placeholder: 'sk-...',
    keyHelp: 'Create a key at platform.openai.com (needs API credit, separate from ChatGPT Plus)',
  },
  gemini: {
    label: 'Google Gemini (free tier, region-limited)',
    model: 'gemini-2.0-flash',
    placeholder: 'AIza...',
    keyHelp: 'Get a key at aistudio.google.com/apikey',
  },
}

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// Calls the chosen provider with a text prompt + image list, returns the model's text reply.
async function callProvider(provider, apiKey, promptText, images) {
  const { model } = PROVIDERS[provider]

  if (provider === 'gemini') {
    const parts = [{ text: promptText }]
    for (const img of images) {
      if (img.label) parts.push({ text: img.label })
      parts.push({ inline_data: { mime_type: img.mime, data: img.b64 } })
    }
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      },
    )
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${resp.status}`)
    }
    const data = await resp.json()
    return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  }

  // OpenAI + OpenRouter share the OpenAI-compatible chat/completions format
  const endpoint = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions'

  const content = [{ type: 'text', text: promptText }]
  for (const img of images) {
    if (img.label) content.push({ type: 'text', text: img.label })
    content.push({ type: 'image_url', image_url: { url: `data:${img.mime};base64,${img.b64}` } })
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
  return data.choices?.[0]?.message?.content || ''
}

export default function App() {
  const [provider, setProvider]   = useState('openrouter')
  const [apiKey, setApiKey]       = useState('')
  const [showKey, setShowKey]     = useState(false)
  const [boardSide, setBoardSide] = useState('A')
  const [files, setFiles]         = useState({})
  const [activeCards, setActiveCards]       = useState([])
  const [completedCards, setCompletedCards] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [results, setResults]     = useState(null)
  const nextId = useRef(1)

  function setFile(key, file) {
    setFiles(prev => ({ ...prev, [key]: file }))
  }

  function addCard(setList) {
    return file => setList(prev => [...prev, { id: nextId.current++, file }])
  }
  function removeCard(setList, id) {
    setList(prev => prev.filter(c => c.id !== id))
  }

  async function calculate() {
    if (!apiKey.trim()) { setError(`Please enter your ${PROVIDERS[provider].label.split(' ')[0]} API key.`); return }
    if (!files.board)   { setError('Please upload at least your board photo.'); return }

    setError('')
    setLoading(true)
    setResults(null)

    try {
      const promptText =
        `Please score this Harmonies board.\n` +
        `• Board side: ${boardSide === 'A' ? 'Side A (River)' : 'Side B (Islands)'}\n` +
        `• Active (in-progress) animal cards: ${activeCards.length}\n` +
        `• Completed animal cards (all cubes placed — each scores its MAXIMUM value): ${completedCards.length}\n` +
        `• Nature's Spirit: ${files.spirit ? 'yes' : 'no'}\n` +
        `Each image below is preceded by a label telling you exactly what it is — trust the label.`

      const labeled = [{ file: files.board, label: 'PERSONAL BOARD photo:' }]
      activeCards.forEach((c, i) => labeled.push({
        file: c.file,
        label: `ACTIVE animal card #${i + 1} — IN PROGRESS. Score it by counting how many cubes have been placed (removed from the card).`,
      }))
      completedCards.forEach((c, i) => labeled.push({
        file: c.file,
        label: `COMPLETED animal card #${i + 1} — ALL cubes have been placed. Score it at its MAXIMUM printed value. Never score a completed card as zero.`,
      }))
      if (files.spirit) labeled.push({ file: files.spirit, label: "NATURE'S SPIRIT card:" })

      const images = []
      for (const { file, label } of labeled) {
        images.push({ label, mime: file.type || 'image/jpeg', b64: await toBase64(file) })
      }

      const text = await callProvider(provider, apiKey.trim(), promptText, images)
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

      {/* Provider + API Key */}
      <section className="card">
        <h2 className="card-title">
          🔑 AI Provider &amp; API Key <span className="badge">stored in memory only</span>
        </h2>
        <select
          className="provider-select"
          value={provider}
          onChange={e => { setProvider(e.target.value); setApiKey(''); setError('') }}
        >
          {Object.entries(PROVIDERS).map(([id, p]) => (
            <option key={id} value={id}>{p.label}</option>
          ))}
        </select>
        <div className="key-row">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={PROVIDERS[provider].placeholder}
            className="key-input"
            autoComplete="off"
          />
          <button className="toggle-btn" onClick={() => setShowKey(s => !s)}>
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="hint">
          Your key is never stored — it lives only in this browser tab and is sent directly to the provider. {PROVIDERS[provider].keyHelp}.
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

      {/* Active animal cards */}
      <section className="card">
        <h2 className="card-title">
          🐾 Active Animal Cards <span className="badge">{activeCards.length} added</span>
        </h2>
        <p className="hint" style={{ marginBottom: 12 }}>
          Cards still in play above your board — some cubes placed, some not. Scored by counting how many cubes you've placed. Add as many as you have.
        </p>
        <div className="upload-grid">
          {activeCards.map((c, i) => (
            <DropZone
              key={c.id}
              label={`Active Card ${i + 1}`}
              subLabel="click ✕ to remove"
              icon="🐾"
              file={c.file}
              onChange={() => {}}
              onRemove={() => removeCard(setActiveCards, c.id)}
            />
          ))}
          <DropZone
            key={`add-active-${activeCards.length}`}
            label="Add active card"
            subLabel="click or drag"
            icon="➕"
            file={null}
            onChange={addCard(setActiveCards)}
            onRemove={() => {}}
          />
        </div>
      </section>

      {/* Completed animal cards */}
      <section className="card">
        <h2 className="card-title">
          ✅ Completed Animal Cards <span className="badge">{completedCards.length} added</span>
        </h2>
        <p className="hint" style={{ marginBottom: 12 }}>
          Finished cards set beside your board with no cubes left on them. Each scores its <strong>maximum</strong> value — upload here so it's never counted as zero. Add as many as you have.
        </p>
        <div className="upload-grid">
          {completedCards.map((c, i) => (
            <DropZone
              key={c.id}
              label={`Completed Card ${i + 1}`}
              subLabel="click ✕ to remove"
              icon="✅"
              file={c.file}
              onChange={() => {}}
              onRemove={() => removeCard(setCompletedCards, c.id)}
            />
          ))}
          <DropZone
            key={`add-completed-${completedCards.length}`}
            label="Add completed card"
            subLabel="click or drag"
            icon="➕"
            file={null}
            onChange={addCard(setCompletedCards)}
            onRemove={() => {}}
          />
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
