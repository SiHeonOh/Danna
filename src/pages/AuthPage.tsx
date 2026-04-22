import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

type Mode = 'login' | 'signup' | 'forgot'

export default function AuthPage() {
  const { signIn, signUp, resetPassword, session } = useAuth()
  const { toggle, theme } = useTheme()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0) // seconds remaining before resend is allowed
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  function startCooldown(seconds = 60) {
    setCooldown(seconds)
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  if (session) {
    navigate('/', { replace: true })
    return null
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setSuccessMsg(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (mode === 'login') {
      setLoading(true)
      const { error } = await signIn(email, password)
      setLoading(false)
      if (error) { setError(error) }
      else { navigate('/', { replace: true }) }
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      setLoading(true)
      const { error, confirmationRequired } = await signUp(email, password)
      setLoading(false)
      if (error) { setError(error) }
      else if (confirmationRequired) {
        setSuccessMsg('Account created — check your email and click the confirmation link to activate it.')
      } else {
        navigate('/', { replace: true })
      }
      return
    }

    if (mode === 'forgot') {
      setLoading(true)
      const { error } = await resetPassword(email)
      setLoading(false)
      if (error) {
        // Surface rate-limit errors more helpfully
        if (error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('too many')) {
          setError('Too many requests — please wait a minute before trying again.')
        } else {
          setError(error)
        }
      } else {
        setSuccessMsg('Reset link sent — check your inbox (and spam folder).')
        startCooldown(60)
      }
    }
  }

  const titles: Record<Mode, string> = {
    login: 'SIGN IN',
    signup: 'CREATE ACCOUNT',
    forgot: 'RESET PASSWORD',
  }

  const submitLabels: Record<Mode, string> = {
    login: 'ACCESS DANNA',
    signup: 'CREATE ACCOUNT',
    forgot: 'SEND RESET LINK',
  }

  const loadingLabels: Record<Mode, string> = {
    login: 'AUTHENTICATING...',
    signup: 'CREATING...',
    forgot: 'SENDING...',
  }

  return (
    <div
      className="flex justify-center p-4"
      style={{ background: 'var(--bg-base)', position: 'fixed', inset: 0, overflowY: 'auto', alignItems: 'flex-start', paddingTop: 'max(24px, 10vh)' }}
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
          padding: 'clamp(24px, 5vw, 40px) clamp(20px, 6vw, 32px)',
        }}
      >
        {/* Logo */}
        <div className="mb-8">
          <h1
            className="font-display text-4xl mb-1"
            style={{ color: 'var(--color-primary)', textShadow: 'var(--glow-primary)' }}
          >
            DANNA
          </h1>
          <p className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
            // PERSONAL COMMAND CENTER
          </p>
        </div>

        {/* Mode heading */}
        <p
          className="font-mono mb-6"
          style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}
        >
          {titles[mode]}
        </p>

        {/* Success state */}
        {successMsg && (
          <div
            className="font-mono text-xs p-3 mb-4"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              lineHeight: 1.6,
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
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

          {/* Password — not shown for forgot mode */}
          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Confirm password — signup only */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword">Confirm password</label>
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
          )}

          {/* Error */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (mode === 'forgot' && cooldown > 0)}
            className="btn-neon w-full mt-2"
            style={{ padding: '12px', fontSize: '13px' }}
          >
            {loading
              ? loadingLabels[mode]
              : mode === 'forgot' && cooldown > 0
                ? `RESEND IN ${cooldown}s`
                : submitLabels[mode]}
          </button>
        </form>

        {/* Mode switcher links */}
        <div
          className="font-mono flex flex-col"
          style={{ marginTop: 24, borderTop: '1px solid var(--color-border-bright)', paddingTop: 16, gap: 12 }}
        >
          {mode === 'login' && (
            <>
              <button
                className="font-mono"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: '6px 0',
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--color-text)',
                }}
                onClick={() => switchMode('forgot')}
              >
                FORGOT PASSWORD?
              </button>
              <button
                className="font-mono"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: '6px 0',
                  fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--color-primary)',
                }}
                onClick={() => switchMode('signup')}
              >
                CREATE AN ACCOUNT →
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button
              className="font-mono"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: '6px 0',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--color-text)',
              }}
              onClick={() => switchMode('login')}
            >
              ← ALREADY HAVE AN ACCOUNT
            </button>
          )}
          {mode === 'forgot' && (
            <button
              className="font-mono"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: '6px 0',
                fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--color-text)',
              }}
              onClick={() => switchMode('login')}
            >
              ← BACK TO SIGN IN
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
