import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarCheck, Users, User, Bell, MessageCircleMore, WalletCards, CalendarClock, UserCog } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'

const NAV_ITEMS = [
  { label: '홈', icon: Home, path: '/dashboard' },
  { label: '내 상담', icon: CalendarCheck, path: '/sessions' },
  { label: '상담사 탐색', icon: Users, path: '/counselors' },
  { label: '마이페이지', icon: User, path: '/mypage' },
]

const COUNSELOR_NAV_ITEMS = [
  { label: '대시보드', icon: Home, path: '/counselor/dashboard' },
  { label: '예약 요청 관리', icon: CalendarCheck, path: '/counselor/bookings' },
  { label: '채팅방', icon: MessageCircleMore, path: '/counselor/chat' },
  { label: '상담 비용 설정', icon: WalletCards, path: '/counselor/session-types' },
  { label: '스케줄 관리', icon: CalendarClock, path: '/counselor/schedule' },
  { label: '프로필 수정', icon: UserCog, path: '/counselor/profile/edit' },
  { label: '마이페이지', icon: User, path: '/counselor/mypage' },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const isCounselor = user?.role === 'COUNSELOR'
  const isChatPage =
    location.pathname === '/chat' || location.pathname.startsWith('/chat/')
  const isReportPage =
    location.pathname === '/report/latest' || location.pathname.startsWith('/report/')

  const hideBottomNav = isCounselor ? true : isChatPage || isReportPage

  return (
    <div className="min-h-screen bg-neutral-50 flex justify-center">
      <div className={`w-full ${isCounselor ? 'max-w-[1200px]' : 'max-w-[402px]'} min-h-screen flex flex-col bg-white relative`}>
        {/* 헤더 */}
        <header className="sticky top-0 z-50 h-14 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <img src={logo} alt="rapport 로고" className="w-8 h-8 object-contain" />
            <span
              className="text-[22px] leading-none text-primary-900"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              rapport
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="text-neutral-600 hover:text-neutral-900 relative" aria-label="알림">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-semantic-error-text text-white text-[10px] leading-[18px] text-center font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 콘텐츠 */}
        {isCounselor ? (
          <main className="flex-1 bg-neutral-50 flex min-h-0">
            <aside className="w-[220px] border-r border-neutral-100 bg-white p-3 hidden md:block">
              <nav className="flex flex-col gap-1">
                {COUNSELOR_NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                  const isActive =
                    location.pathname === path || location.pathname.startsWith(path + '/')
                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => navigate(path)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </nav>
            </aside>
            <section className="flex-1 min-w-0 overflow-y-auto">
              <Outlet />
            </section>
          </main>
        ) : (
          <main className={`flex-1 flex flex-col ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            <Outlet />
          </main>
        )}

        {/* 하단 네비게이션 */}
        {!hideBottomNav && (
          <nav className="sticky bottom-0 z-50 h-16 bg-white flex">
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
              const isActive =
                location.pathname === path || location.pathname.startsWith(path + '/')
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5"
                >
                  <Icon
                    size={22}
                    className={isActive ? 'text-primary-600' : 'text-neutral-400'}
                  />
                  <span
                    className={`text-small font-medium ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
