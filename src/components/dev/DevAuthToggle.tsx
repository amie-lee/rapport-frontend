import { useAuthStore } from '@/store/authStore'

export const DevAuthToggle = () => {
  const { setAuth, clearAuth } = useAuthStore()

  if (import.meta.env.PROD) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex gap-2">
      <button
        onClick={() =>
          setAuth({
            accessToken: 'fake-token',
            refreshToken: 'fake-refresh-token',
            user: {
              id: 'user-1',
              email: 'test@rapport.kr',
              role: 'CLIENT',
              name: '테스트유저',
            },
          })
        }
        className="bg-green-500 text-white px-3 py-1 rounded text-xs"
      >
        로그인
      </button>
      <button
        onClick={() => clearAuth()}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs"
      >
        로그아웃
      </button>
    </div>
  )
}
