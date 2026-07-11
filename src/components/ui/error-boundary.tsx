import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { i18n } from '@/lib/i18n'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">{i18n.t('error.something_went_wrong')}</h2>
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {i18n.t('error.unexpected')}
            </p>
            <Button onClick={() => this.setState({ error: null })} className="h-9 rounded-full spring-transition text-xs font-bold gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              {i18n.t('error.try_again')}
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
