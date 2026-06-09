import { useRef, useState } from 'react'

export default function DropZone({ label, subLabel, icon, file, onChange, onRemove, wide }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)

  function handleFile(f) {
    if (f && f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
      onChange(f)
    }
  }

  function handleRemove(e) {
    e.stopPropagation()
    setPreview(null)
    inputRef.current.value = ''
    onRemove()
  }

  return (
    <div
      className={[
        'drop-zone',
        preview ? 'has-image' : '',
        dragging ? 'drag-over' : '',
        wide ? 'wide' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => !preview && inputRef.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
    >
      {preview ? (
        <>
          <img src={preview} alt="preview" className="dz-preview" />
          <div className="dz-overlay" onClick={handleRemove}>
            <span>✕ Remove</span>
          </div>
        </>
      ) : (
        <>
          <span className="dz-icon">{icon}</span>
          <span className="dz-label">{label}</span>
          <span className="dz-sublabel">{subLabel}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}
