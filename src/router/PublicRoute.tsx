import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function PublicRoute() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  const isOAuthCallbackPath = location.pathname === '/oauth2/callback'

  const allowClientSignupPath =
    (location.pathname === '/signup' || location.pathname === '/signup-complete') &&
    user?.role === 'CLIENT'

  const allowCounselorOnboardingPath =
    user?.role === 'COUNSELOR' &&
    (
      location.pathname === '/counselor-signup' ||
      location.pathname === '/signup/counselor' ||
      location.pathname === '/counselor-signup-complete' ||
      location.pathname === '/counselor-login' ||
      location.pathname === '/login/counselor'
    )

  if (isLoggedIn && !allowClientSignupPath && !allowCounselorOnboardingPath && !isOAuthCallbackPath) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
    return <Navigate to={user?.role === 'COUNSELOR' ? '/counselor/dashboard' : '/dashboard'} replace />
  }

  return <Outlet />
}
