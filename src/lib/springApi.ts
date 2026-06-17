import { useAuthStore } from '@/store/authStore'

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState()
    if (!refreshToken) return null

    const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      clearAuth()
      return null
    }

    const payload = await res.json()
    const nextAccessToken = payload?.data?.accessToken ?? payload?.accessToken
    const nextRefreshToken = payload?.data?.refreshToken ?? payload?.refreshToken ?? refreshToken
    if (!nextAccessToken) {
      clearAuth()
      return null
    }

    setTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken })
    return nextAccessToken as string
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export async function springFetch(path: string, init?: RequestInit, canRetry = true): Promise<Response> {
  const { accessToken } = useAuthStore.getState()
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (res.status !== 401 || !canRetry) return res

  const refreshed = await refreshAccessToken()
  if (!refreshed) return res
  return springFetch(path, init, false)
}

