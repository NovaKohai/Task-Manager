import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListTodo, BarChart3, Settings, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { i18n } from '@/lib/i18n'

function getSteps() {
  return [
    { title: i18n.t('onboarding.welcome.title'), description: i18n.t('onboarding.welcome.desc'), icon: LayoutDashboard },
    { title: i18n.t('onboarding.dashboards.title'), description: i18n.t('onboarding.dashboards.desc'), icon: LayoutDashboard },
    { title: i18n.t('onboarding.task_management.title'), description: i18n.t('onboarding.task_management.desc'), icon: ListTodo },
    { title: i18n.t('onboarding.reports.title'), description: i18n.t('onboarding.reports.desc'), icon: BarChart3 },
    { title: i18n.t('onboarding.settings.title'), description: i18n.t('onboarding.settings.desc'), icon: Settings },
  ]
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const steps = getSteps()
  const isLast = step === steps.length - 1

  function handleNext() {
    if (isLast) {
      localStorage.setItem('ttm_onboarding_done', 'true')
      navigate('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  function handleSkip() {
    localStorage.setItem('ttm_onboarding_done', 'true')
    navigate('/dashboard')
  }

  const s = steps[step]
  const Icon = s.icon

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 w-12 rounded-full transition-all', i <= step ? 'bg-primary' : 'bg-muted/40')} />
          ))}
        </div>

        <div className="glass-panel animate-rise">
          <div className="glass-panel-inner space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 spring-transition">
              <Icon className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">{s.title}</h1>
              <p className="text-sm text-muted-foreground/90 leading-relaxed">{s.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip} className="h-9 text-xs rounded-full spring-transition">
            {i18n.t('onboarding.skip')}
          </Button>
          <Button onClick={handleNext} className="h-9 rounded-full spring-transition text-xs font-bold gap-1.5 px-5">
            {isLast ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            {isLast ? i18n.t('onboarding.get_started') : i18n.t('onboarding.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
