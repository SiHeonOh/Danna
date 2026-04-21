import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const { toggle, theme } = useTheme()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Supabase automatically exchanges the token in the URL hash/query params
  // and fires onAuthStateChange with event PASSWORD_RECOVERY.
  // We wait for that before showing the form so we know we have a valid recovery session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Also check if a session already exists (e.g. page refresh after recovery link clicked)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      setDone(true)
      // Sign out the recovery session and send to login
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Theme toggle */}
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
        {/* Logo */}
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

        <p
          className="font-mono mb-6"
          style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}
        >
          SET NEW PASSWORD
        </p>

        {/* Waiting for token exchange */}
        {!ready && (
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
            VERIFYING LINK...
          </p>
        )}

        {/* Success */}
        {done && (
          <div
            className="font-mono text-xs p-3"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              lineHeight: 1.6,
            }}
          >
            PASSWORD UPDATED — redirecting to sign in...
          </div>
        )}

        {/* Form */}
        {ready && !done && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
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
              {loading ? 'UPDATING...' : 'SET NEW PASSWORD'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
