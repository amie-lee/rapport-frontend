import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/logo.svg'

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.38c0 2.088 1.323 3.915 3.321 4.983L4.05 15.09a.188.188 0 0 0 .273.21l3.549-2.34A8.86 8.86 0 0 0 9 13.26c4.142 0 7.5-2.634 7.5-5.88S13.142 1.5 9 1.5Z"
        fill="#212121"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function KakaoLoginButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="w-full h-12 flex items-center justify-center gap-1.5 bg-[#FFEB00] rounded-[8px] font-bold text-sm text-[#212121] hover:brightness-95 active:brightness-90 transition-all"
    >
      <KakaoIcon />
      <span>카카오로 시작하기</span>
    </a>
  )
}

function GoogleLoginButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="w-full h-12 flex items-center justify-center gap-1.5 bg-white border border-neutral-200 rounded-[8px] font-bold text-sm text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 transition-all"
    >
      <GoogleIcon />
      <span>Google로 시작하기</span>
    </a>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

  const kakaoAuthUrl = `${apiBaseUrl}/api/v1/auth/oauth2/authorize/kakao`
  const googleAuthUrl = `${apiBaseUrl}/api/v1/auth/oauth2/authorize/google`

  return (
    <div className="flex flex-col items-center w-full px-[36px]">
      <img
        src={logo}
        alt="rapport 로고"
        className="w-[200px] h-[200px] mt-[128px] object-contain"
      />

      <p
        className="text-[36px] leading-[22px] text-primary-900 mt-0 mb-0"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        rapport
      </p>

      <div className="flex flex-col gap-[16px] w-full mt-[94px]">
        <KakaoLoginButton href={kakaoAuthUrl} />
        <GoogleLoginButton href={googleAuthUrl} />
      </div>

      <button
        type="button"
        onClick={() => navigate('/counselor-login')}
        className="mt-[104px] flex items-center gap-1 text-[13px] leading-[19.5px] text-primary-800 hover:underline"
      >
        <span>상담사이신가요?</span>
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
