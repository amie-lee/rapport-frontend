import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'

import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import SignupCompletePage from '@/pages/auth/SignupCompletePage'
import CounselorLoginPage from '@/pages/auth/CounselorLoginPage'
import CounselorSignupPage from '@/pages/auth/CounselorSignupPage'
import CounselorSignupCompletePage from '@/pages/auth/CounselorSignupCompletePage'
import CounselorCredentialPage from '@/pages/auth/CounselorCredentialPage'
import CounselorCredentialCompletePage from '@/pages/auth/CounselorCredentialCompletePage'
import CounselorPendingPage from '@/pages/auth/CounselorPendingPage'
import CounselorProfilePage from '@/pages/auth/CounselorProfilePage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import ChatPage from '@/pages/ChatPage'
import ReportPage from '@/pages/ReportPage'
import CounselorListPage from '@/pages/CounselorListPage'
import CounselorDetailPage from '@/pages/CounselorDetailPage'
import BookingPage from '@/pages/BookingPage'
import MyPage from '@/pages/MyPage'
import IntakeFormPage from '@/pages/IntakeFormPage'
import MySessionsPage from '@/pages/MySessionsPage'
import ReviewPage from '@/pages/ReviewPage'
import MyReportsPage from '@/pages/MyReportsPage'
import EditProfilePage from '@/pages/EditProfilePage'
import CounselorDashboardPage from '@/pages/CounselorDashboardPage'
import CounselorBookingsPage from '@/pages/CounselorBookingsPage'
import AdminPage from '@/pages/AdminPage'
import CounselorProfileEditPage from '@/pages/CounselorProfileEditPage'
import CounselorMyPage from '@/pages/CounselorMyPage'
import CounselorChatRoomsPage from '@/pages/CounselorChatRoomsPage'
import CounselorChatRoomPage from '@/pages/CounselorChatRoomPage'
import CounselorSessionTypeSettingsPage from '@/pages/CounselorSessionTypeSettingsPage'
import CounselorSchedulePage from '@/pages/CounselorSchedulePage'

function RootRedirect() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Navigate to={user?.role === 'COUNSELOR' ? '/counselor/dashboard' : '/dashboard'} replace />
}

export const router = createBrowserRouter([
  {
    index: true,
    element: <RootRedirect />,
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
          { path: '/signup-complete', element: <SignupCompletePage /> },
          { path: '/counselor-login', element: <CounselorLoginPage /> },
          { path: '/login/counselor', element: <CounselorLoginPage /> },
          { path: '/counselor-signup', element: <CounselorSignupPage /> },
          { path: '/signup/counselor', element: <CounselorSignupPage /> },
          { path: '/counselor-signup-complete', element: <CounselorSignupCompletePage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/oauth2/callback', element: <OAuthCallbackPage /> },
        ],
      },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/admin', element: <AdminPage /> },
      { path: '/counselor-credential', element: <CounselorCredentialPage /> },
      { path: '/counselor-credential-complete', element: <CounselorCredentialCompletePage /> },
      { path: '/counselor-pending', element: <CounselorPendingPage /> },
      { path: '/counselor-profile', element: <CounselorProfilePage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/chat/:sessionId', element: <ChatPage /> },
          { path: '/report/:reportId', element: <ReportPage /> },
          { path: '/counselors', element: <CounselorListPage /> },
          { path: '/counselors/:id', element: <CounselorDetailPage /> },
          { path: '/booking/:counselorId', element: <BookingPage /> },
          { path: '/mypage', element: <MyPage /> },
          { path: '/mypage/profile', element: <EditProfilePage /> },
          { path: '/my/reports', element: <MyReportsPage /> },
          { path: '/intake-form', element: <IntakeFormPage /> },
          { path: '/intake-form/:bookingId', element: <IntakeFormPage /> },
          { path: '/sessions', element: <MySessionsPage /> },
          { path: '/review/:sessionId', element: <ReviewPage /> },
          { path: '/counselor/dashboard', element: <CounselorDashboardPage /> },
          { path: '/counselor/bookings', element: <CounselorBookingsPage /> },
          { path: '/counselor/profile/edit', element: <CounselorProfileEditPage /> },
          { path: '/counselor/mypage', element: <CounselorMyPage /> },
          { path: '/counselor/chat', element: <CounselorChatRoomsPage /> },
          { path: '/counselor/chat/:roomId', element: <CounselorChatRoomPage /> },
          { path: '/counselor/session-types', element: <CounselorSessionTypeSettingsPage /> },
          { path: '/counselor/schedule', element: <CounselorSchedulePage /> },
        ],
      },
    ],
  },
])
