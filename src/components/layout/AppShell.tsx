import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function AppShell() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <span className="font-mono text-sm" style={{ color: 'var(--color-text-muted)' }}>
          INITIALIZING...
        </span>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <Outlet />
}
