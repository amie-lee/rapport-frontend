import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { springFetch } from '@/lib/springApi'
import { useAuthStore } from '@/store/authStore'

interface UserInfo {
  id: number
  email: string
  name: string
  profileImageUrl?: string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
}

export default function EditProfilePage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const storeUser = useAuthStore((s) => s.user)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await springFetch('/api/v1/auth/me')
        if (!res.ok) throw new Error('me failed')
        const payload: ApiResponse<UserInfo> = await res.json()
        const me = payload?.data
        setName(me?.name ?? storeUser?.name ?? '')
        setEmail(me?.email ?? storeUser?.email ?? '')
        setError(null)
      } catch {
        setError('내 정보를 불러오지 못했어요.')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [storeUser?.email, storeUser?.name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await springFetch('/api/v1/users/me/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error('update failed')

      if (accessToken && storeUser) {
        setAuth({
          accessToken,
          refreshToken,
          user: { ...storeUser, name: trimmed },
        })
      }
      navigate('/mypage', { replace: true })
    } catch {
      setError('정보 수정에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      <PageHeader title="프로필 정보 수정" />
      <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
        {loading && <p className="text-caption text-neutral-400">불러오는 중...</p>}
        {error && <p className="text-caption text-semantic-error-text">{error}</p>}

        <Input
          id="name"
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
        />
        <Input
          id="email"
          label="이메일"
          value={email}
          onChange={() => {}}
          disabled
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2"
          disabled={submitting || !name.trim()}
        >
          {submitting ? '저장 중...' : '저장'}
        </Button>
      </form>
    </div>
  )
}
