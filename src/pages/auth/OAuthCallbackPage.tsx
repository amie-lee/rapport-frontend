import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface MeResponse {
  success?: boolean
  data?: {
    id?: number | string
    email?: string
    role?: 'CLIENT' | 'COUNSELOR' | 'ADMIN'
    name?: string
    isNewUser?: boolean
    newUser?: boolean
    profileCompleted?: boolean
    onboardingCompleted?: boolean
  }
}

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) return
    handledRef.current = true

    const run = async () => {
      // Prevent stale persisted auth (e.g. previous counselor session) from affecting callback routing.
      clearAuth()

      const params = new URLSearchParams(window.location.search)
      const accessToken = params.get('accessToken')
      const refreshToken = params.get('refreshToken')

      if (!accessToken || !refreshToken) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!res.ok) {
          throw new Error('auth/me request failed')
        }

        const payload: MeResponse = await res.json()
        const me = payload?.data

        if (!me?.email || !me?.role || !me?.id) {
          throw new Error('invalid me response')
        }

        const isNewUser = me.isNewUser === true || me.newUser === true
        const profileCompleted = me.profileCompleted === true
        const onboardingCompleted = me.onboardingCompleted === true

        let nextPath = '/dashboard'
        if (me.role === 'ADMIN') {
          nextPath = '/admin'
        } else if (isNewUser || !profileCompleted) {
          nextPath = '/signup'
        } else if (profileCompleted && !onboardingCompleted) {
          nextPath = '/chat'
        }

        setAuth({
          accessToken,
          refreshToken,
          user: {
            id: String(me.id),
            email: me.email,
            role: me.role,
            name: me.name ?? me.email.split('@')[0] ?? '사용자',
          },
        })

        window.history.replaceState({}, document.title, nextPath)
        navigate(nextPath, { replace: true })
      } catch {
        clearAuth()
        navigate('/login', { replace: true })
      }
    }

    void run()
  }, [clearAuth, navigate, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <p className="text-body-md text-neutral-600">로그인 처리 중입니다...</p>
    </div>
  )
}
