import { useAuthStore } from '@/store/authStore'
import { springFetch } from '@/lib/springApi'

export type CounselorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface ApiResponse<T> {
  data?: T
}

interface AuthMeResponse {
  role?: 'CLIENT' | 'COUNSELOR' | 'ADMIN'
  approvalStatus?: CounselorApprovalStatus
  credentialsSubmitted?: boolean
}

interface CounselorProfileResponse {
  approvalStatus?: CounselorApprovalStatus
  profileCompleted?: boolean
  requiredMissingFields?: string[]
}

export async function routeCounselorAfterLogin(navigate: (path: string, opts?: { replace?: boolean }) => void) {
  const meRes = await springFetch('/api/v1/auth/me')
  if (!meRes.ok) {
    navigate('/counselor-login', { replace: true })
    return
  }

  const mePayload: ApiResponse<AuthMeResponse> = await meRes.json().catch(() => ({}))
  const me = mePayload?.data
  const status = me?.approvalStatus
  const credentialsSubmitted = me?.credentialsSubmitted === true

  if (me?.role === 'ADMIN') {
    navigate('/admin', { replace: true })
    return
  }

  if (me?.role !== 'COUNSELOR') {
    navigate('/dashboard', { replace: true })
    return
  }

  if (!credentialsSubmitted) {
    navigate('/counselor-credential', { replace: true })
    return
  }

  if (status === 'PENDING') {
    navigate('/counselor-pending', { replace: true })
    return
  }

  if (status === 'REJECTED') {
    navigate('/counselor-credential', { replace: true })
    return
  }

  if (status === 'APPROVED') {
    const profileRes = await springFetch('/api/v1/counselor/profile')
    if (profileRes.ok) {
      const profilePayload: ApiResponse<CounselorProfileResponse> = await profileRes.json().catch(() => ({}))
      const profile = profilePayload?.data
      const profileCompleted = profile?.profileCompleted === true
      if (!profileCompleted) {
        navigate('/counselor-profile', { replace: true })
        return
      }
    }
    navigate('/counselor/dashboard', { replace: true })
    return
  }

  navigate('/counselor-pending', { replace: true })
}

export function applyCounselorAuthFromTokenResponse(payload: any) {
  const tokenData = payload?.data ?? payload
  const accessToken = tokenData?.accessToken
  const refreshToken = tokenData?.refreshToken
  const user = tokenData?.user

  if (!accessToken || !user) {
    throw new Error('invalid auth response')
  }

  useAuthStore.getState().setAuth({
    accessToken,
    refreshToken: refreshToken ?? null,
    user: {
      id: String(user.id),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  })
}
