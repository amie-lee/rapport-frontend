import { useNavigate } from 'react-router-dom'
import { TopNavBar } from '../ui/TopNavBar'

interface PageHeaderProps {
  title: string
  onBack?: () => void
}

export function PageHeader({ title, onBack }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="px-5 bg-white">
      <TopNavBar title={title} onBack={onBack ?? (() => navigate(-1))} />
    </div>
  )
}
