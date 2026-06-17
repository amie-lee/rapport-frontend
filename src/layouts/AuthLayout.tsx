import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full max-w-[402px] flex flex-col items-center flex-1">
        <Outlet />
      </div>
    </div>
  )
}
