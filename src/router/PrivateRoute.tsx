import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function PrivateRoute() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
