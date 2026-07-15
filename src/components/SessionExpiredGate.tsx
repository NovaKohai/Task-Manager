import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { i18n } from '@/lib/i18n'

export default function SessionExpiredGate() {
  const navigate = useNavigate()
  useEffect(() => {
    const REDIRECT_AFTER_PAINT_MS = 100
    const t = setTimeout(() => navigate('/login', { replace: true }), REDIRECT_AFTER_PAINT_MS)
    return () => clearTimeout(t)
  }, [navigate])
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
        <ArrowLeft className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">{i18n.t('login.title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{i18n.t('loading')}</p>
      </div>
    </div>
  )
}
