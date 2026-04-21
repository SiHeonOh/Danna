import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

export default function AuthPage() {
  const { signIn, session } = useAuth()
  const { toggle, theme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <button className="btn-ghost" onClick={toggle}>
          {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
      </div>

      <div
        className="w-full max-w-sm"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--color-border-bright)',
          boxShadow: 'var(--shadow-hard)',
          padding: '40px 32px',
        }}
      >
        <div className="mb-8">
          <h1
            className="font-display text-4xl mb-1"
            style={{ color: 'var(--color-primary)', textShadow: 'var(--glow-primary)' }}
          >
            GRID
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
            // PERSONAL COMMAND CENTER
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="user@domain.com"
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="font-mono text-xs p-3"
              style={{
                background: 'color-mix(in srgb, var(--color-secondary) 10%, transparent)',
                border: '1px solid var(--color-secondary)',
                color: 'var(--color-secondary)',
              }}
            >
              ERROR: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full mt-2"
            style={{ padding: '12px', fontSize: '13px' }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS GRID'}
          </button>
        </form>
      </div>
    </div>
  )
}
