import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { PlannerProvider } from '@/context/PlannerContext'
import AppShell from '@/components/layout/AppShell'
import AuthPage from '@/pages/AuthPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import PlannerPage from '@/pages/PlannerPage'

function ProtectedApp() {
  return (
    <PlannerProvider>
      <PlannerPage />
    </PlannerProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<ProtectedApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
