const PRESET_COLORS = [
  '#39FF14', '#FF006E', '#00F0FF', '#FFE600',
  '#FF4500', '#BF5FFF', '#00FF9F', '#FF9900',
  '#FF1493', '#00BFFF', '#ADFF2F', '#FF6600',
  '#FF0066', '#7FFF00', '#FF00FF', '#00FFFF',
]

interface ColorSwatchProps {
  value: string
  onChange: (color: string) => void
}

export default function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginBottom: 8 }}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            style={{
              width: 24,
              height: 24,
              background: color,
              border: value === color ? '2px solid var(--color-text)' : '1px solid transparent',
              boxShadow: value === color ? `0 0 6px ${color}` : 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={color}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: value,
            border: '1px solid var(--color-border-bright)',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          placeholder="#39FF14"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
        />
      </div>
    </div>
  )
}
