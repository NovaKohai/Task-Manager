import React, { Component, ErrorInfo } from 'react'
import { AlertTriangle, CheckCircle, RefreshCcw, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  consent: boolean
  submitting: boolean
  ticketCode: string | null
  ticketError: string | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    consent: false,
    submitting: false,
    ticketCode: null,
    ticketError: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('Uncaught error bound:', error, errorInfo)
  }

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError)
    window.addEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  private handleGlobalError = (event: ErrorEvent) => {
    console.warn('Caught global uncaught error:', event.error)
    if (event.error && !this.state.hasError) {
      this.setState({
        hasError: true,
        error: event.error,
      })
    }
  }

  private handlePromiseRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault()
    console.warn('Caught global unhandled rejection:', event.reason)
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    if (!this.state.hasError) {
      this.setState({
        hasError: true,
        error: err,
      })
    }
  }

  private async gatherDiagnostics() {
    let deviceInfo = `${navigator.platform} | ${navigator.userAgent}`
    let systemLog = `Error: ${this.state.error?.message}\nStack:\n${this.state.error?.stack || ''}\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`

    if (window.electronAPI) {
      try {
        const info = await window.electronAPI.getSystemInfo()
        if (info && !info.error) {
          deviceInfo = `${info.cpuModel} | ${info.osType} ${info.osRelease} (${info.osArch})`
          systemLog += `\n\n[Electron Info]\n${JSON.stringify(info, null, 2)}`
        }
      } catch { /* Electron API may be unavailable in browser — fall back to navigator info */ }
    }
    return { deviceInfo, systemLog }
  }

  private getCreatorId(): string {
    try {
      const sessionStr = localStorage.getItem('ttm_session')
      if (sessionStr) {
        const session = JSON.parse(sessionStr)
        if (session?.userId) return session.userId
      }
    } catch { /* localStorage may be blocked or corrupted — fall back to 'anonymous' */ }
    return 'anonymous'
  }

  private handleOpenTicket = async () => {
    if (!this.state.consent || this.state.submitting) return
    this.setState({ submitting: true, ticketError: null })

    try {
      const { deviceInfo, systemLog } = await this.gatherDiagnostics()
      const creatorId = this.getCreatorId()

      const ticket = db.createSupportTicket({
        creatorId,
        category: 'software',
        description: `[AUTOMATED APP CRASH REPORT]\nURL: ${window.location.href}\nMessage: ${this.state.error?.message || 'Unknown render error'}\n\nStack:\n${this.state.error?.stack || 'N/A'}`,
        deviceInfo,
        systemLog,
        priority: 'high',
      })

      this.setState({ ticketCode: ticket.id, submitting: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open ticket'
      this.setState({ ticketError: message, submitting: false })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '#/dashboard'
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      const { error, ticketCode, consent, submitting, ticketError, showDetails } = this.state

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 font-outfit select-none">
          <div className="w-full max-w-2xl bg-surface/40 backdrop-blur-xl border border-border/10 rounded-3xl p-8 shadow-diffusion flex flex-col gap-6 animate-rise text-right rtl:text-right ltr:text-left">
            
            {/* Header / Title */}
            <div className="flex items-center gap-4 border-b border-border/5 pb-4">
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  {i18n.t('error.boundary.title')}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {i18n.t('error.boundary.desc')}
                </p>
              </div>
            </div>

            {/* Error Message summary */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/15 rounded-2xl p-4 flex flex-col gap-1 text-left ltr:text-left rtl:text-left">
                <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                  {i18n.t('error.generic')}
                </span>
                <span className="text-sm font-bold text-foreground leading-normal whitespace-pre-wrap font-mono select-text">
                  {error.message || String(error)}
                </span>
              </div>
            )}

            {/* Technical details toggle */}
            <div className="border border-border/5 rounded-2xl overflow-hidden bg-muted/10">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="w-full flex items-center justify-between p-4 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <span>{i18n.t('error.boundary.details')}</span>
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {showDetails && error && (
                <div className="px-4 pb-4 overflow-x-auto max-h-48 text-[10px] font-mono text-muted-foreground select-text whitespace-pre leading-relaxed border-t border-border/5 pt-3 bg-background/30 text-left">
                  {error.stack || 'No stack trace available.'}
                </div>
              )}
            </div>

            {/* Support Ticket Consent / Submission */}
            <div className="bg-surface/60 border border-border/10 rounded-2xl p-5 flex flex-col gap-4">
              
              {!ticketCode ? (
                <>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => this.setState({ consent: e.target.checked })}
                      className="mt-0.5 rounded-lg h-5 w-5 bg-background border-border/10 accent-primary cursor-pointer"
                    />
                    <label
                      htmlFor="consent"
                      className="text-xs text-foreground/80 leading-normal cursor-pointer select-none font-bold"
                    >
                      {i18n.t('error.boundary.report_consent')}
                    </label>
                  </div>

                  {ticketError && (
                    <span className="text-caption text-destructive font-bold">{ticketError}</span>
                  )}

                  <Button
                    onClick={this.handleOpenTicket}
                    disabled={!consent || submitting}
                    className="w-full h-10 rounded-xl font-bold"
                  >
                    {submitting ? i18n.t('error.boundary.reporting') : i18n.t('error.boundary.btn.report')}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 gap-3 animate-rise">
                  <div className="h-10 w-10 rounded-full bg-success/15 text-success flex items-center justify-center">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {i18n.t('error.boundary.ticket_success').replace('{code}', ticketCode)}
                  </span>
                </div>
              )}

            </div>

            {/* General Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={this.handleReload}
                variant="secondary"
                className="flex-1 h-10 rounded-xl font-bold border-border/10 hover:border-border/20 text-foreground bg-background flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                {i18n.t('error.boundary.btn.reload')}
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="secondary"
                className="flex-1 h-10 rounded-xl font-bold border-border/10 hover:border-border/20 text-foreground bg-background flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                {i18n.t('error.boundary.btn.home')}
              </Button>
            </div>

          </div>
        </div>
      )
    }

    return this.props.children
  }
}
