import { useState, useEffect, useRef, useMemo } from 'react'
import { LifeBuoy, X } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useSupportStore } from '@/stores/supportStore'
import { hasPermission } from '@/lib/utils'
import type { SupportTicketCategory, SupportTicketStatus, Priority } from '@/lib/types'
import { db } from '@/lib/db'
import { TicketSubmitForm } from '@/components/support/TicketSubmitForm'
import { MyTicketsList } from '@/components/support/MyTicketsList'
import { ItQueueManager } from '@/components/support/ItQueueManager'

export default function Support() {
  const user = useAuthStore((s) => s.user)
  const { users, fetchUsers } = useUserStore()
  const { tickets, isLoading, fetchTickets, createTicket, updateTicket } = useSupportStore()

  const settings = useMemo(() => db.getSettings(), [])
  const [category, setCategory] = useState<SupportTicketCategory>('network')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  
  const [activeTab, setActiveTab] = useState<'submit' | 'my_tickets' | 'queue'>('submit')
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicketStatus>('all')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notesByTicket, setNotesByTicket] = useState<Record<string, string>>({})
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({})
  const [selectedRating, setSelectedRating] = useState<Record<string, number>>({})
  const [feedbackTextByTicket, setFeedbackTextByTicket] = useState<Record<string, string>>({})

  const isIT = hasPermission(user, 'support.manage')

  useEffect(() => {
    fetchUsers()
    fetchTickets()
  }, [fetchUsers, fetchTickets])

  // Automatically switch tab if user is IT to view the queue, or fallback to submit
  useEffect(() => {
    if (isIT) {
      setActiveTab('queue')
    } else {
      setActiveTab('submit')
    }
  }, [isIT])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(i18n.t('support.form.image_size_error'))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result)
          setError('')
        }
      }
      reader.onerror = () => {
        setError(i18n.t('support.form.image_load_error'))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSuccess(false)

    if (!description.trim()) {
      setError(i18n.t('support.form.desc_required_error'))
      return
    }

    if (!user) return

    setSubmitting(true)
    try {
      let deviceInfo: string | undefined
      let systemLog: string | undefined
      try {
        if (window.electronAPI) {
          const info = await window.electronAPI.getSystemInfo()
          if (info && !info.error) {
            deviceInfo = `${info.cpuModel} | ${info.osType} ${info.osRelease} (${info.osArch}) | RAM: ${info.totalMem} (Free: ${info.freeMem})`
            systemLog = JSON.stringify(info, null, 2)
          }
        } else {
          deviceInfo = `${navigator.platform} | ${navigator.userAgent}`
        }
      } catch (_) { /* ignore system info errors */ }

      const usePriority = settings.supportEnablePriority && hasPermission(user, 'support.priority')

      await createTicket({
        creatorId: user.id,
        category,
        description: description.trim(),
        image: image || undefined,
        deviceInfo,
        systemLog,
        priority: usePriority ? priority : 'medium',
      })
      setSuccess(true)
      setDescription('')
      setImage('')
      setPriority('medium')
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      setTimeout(() => {
        setActiveTab('my_tickets')
        setSuccess(false)
      }, 1500)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (ticketId: string) => {
    const notes = notesByTicket[ticketId] || ''
    await updateTicket(ticketId, { status: 'completed', resolutionNotes: notes.trim() })
  }

  const handleFeedbackSubmit = async (ticketId: string) => {
    const rating = selectedRating[ticketId]
    const feedbackText = feedbackTextByTicket[ticketId] || ''
    if (!rating) return
    await updateTicket(ticketId, { rating, feedbackText: feedbackText.trim() })
  }

  const handleAssign = async (ticketId: string) => {
    if (!user) return
    await updateTicket(ticketId, { assigneeId: user.id, status: 'in_progress' })
  }

  const handleStatusChange = async (ticketId: string, newStatus: SupportTicketStatus) => {
    await updateTicket(ticketId, { status: newStatus })
  }

  const getUserName = (id: string | null) => {
    if (!id) return '—'
    return users.find(u => u.id === id)?.name || id
  }

  const getUserDetails = (id: string) => {
    return users.find(u => u.id === id)
  }

  const myTickets = tickets.filter(t => t.creatorId === user?.id)
  const filteredQueue = tickets.filter(t => {
    if (filterStatus === 'all') return true
    return t.status === filterStatus
  })

  const getStatusBadgeVariant = (status: SupportTicketStatus) => {
    switch (status) {
      case 'completed': return 'success' as const
      case 'in_progress': return 'primary' as const
      default: return 'warning' as const
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 font-outfit">
      {/* Expanded Image Overlay Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300"
          onClick={() => setExpandedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[85vh] bg-surface p-2 rounded-2xl border shadow-2xl overflow-hidden animate-rise"
            onClick={e => e.stopPropagation()}
          >
            <img src={expandedImage} alt="Attachment" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            <button 
              className="absolute top-4 right-4 bg-background/50 hover:bg-background/80 text-foreground p-2 rounded-full transition-colors"
              onClick={() => setExpandedImage(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-1 mb-8 text-right rtl:text-right ltr:text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{i18n.t('support.title')}</h1>
            <p className="text-caption text-muted-foreground">{i18n.t('support.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col gap-6">
        <div className="flex border-b border-border/10 pb-px gap-2">
          {isIT && (
            <button
              onClick={() => setActiveTab('queue')}
              className={`pb-3 px-4 text-sm font-bold border-b-2 active:scale-[0.97] transition-all duration-150 relative ${
                activeTab === 'queue'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {i18n.t('support.tab.queue')}
              {tickets.filter(t => t.status !== 'completed').length > 0 && (
                <span className="absolute top-1.5 right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {tickets.filter(t => t.status !== 'completed').length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('submit')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 active:scale-[0.97] transition-all duration-150 ${
              activeTab === 'submit'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {i18n.t('support.tab.submit')}
          </button>
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 active:scale-[0.97] transition-all duration-150 ${
              activeTab === 'my_tickets'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {i18n.t('support.tab.my_tickets')}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          {activeTab === 'submit' && (
            <TicketSubmitForm
              category={category}
              setCategory={setCategory}
              description={description}
              setDescription={setDescription}
              image={image}
              priority={priority}
              setPriority={setPriority}
              error={error}
              success={success}
              submitting={submitting}
              handleSubmit={handleSubmit}
              handleImageChange={handleImageChange}
              handleRemoveImage={handleRemoveImage}
              fileInputRef={fileInputRef}
              settings={settings}
              user={user}
            />
          )}

          {activeTab === 'my_tickets' && (
            <MyTicketsList
              myTickets={myTickets}
              isLoading={isLoading}
              user={user}
              settings={settings}
              getStatusBadgeVariant={getStatusBadgeVariant}
              setExpandedImage={setExpandedImage}
              getUserName={getUserName}
              hoveredRating={hoveredRating}
              setHoveredRating={setHoveredRating}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              feedbackTextByTicket={feedbackTextByTicket}
              setFeedbackTextByTicket={setFeedbackTextByTicket}
              handleFeedbackSubmit={handleFeedbackSubmit}
            />
          )}

          {activeTab === 'queue' && isIT && (
            <ItQueueManager
              tickets={tickets}
              filteredQueue={filteredQueue}
              isLoading={isLoading}
              user={user}
              settings={settings}
              getStatusBadgeVariant={getStatusBadgeVariant}
              setExpandedImage={setExpandedImage}
              getUserDetails={getUserDetails}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              notesByTicket={notesByTicket}
              setNotesByTicket={setNotesByTicket}
              handleAssign={handleAssign}
              handleResolve={handleResolve}
              handleStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
