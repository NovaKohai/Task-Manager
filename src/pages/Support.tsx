import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { LifeBuoy, X, Search, ArrowUpDown } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useSupportStore } from '@/stores/supportStore'
import { hasPermission } from '@/lib/utils'
import type { SupportTicket, SupportTicketCategory, SupportTicketStatus, Priority } from '@/lib/types'
import { db } from '@/lib/db'
import { TicketSubmitForm } from '@/components/support/TicketSubmitForm'
import { MyTicketsList } from '@/components/support/MyTicketsList'
import { ItQueueManager } from '@/components/support/ItQueueManager'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type SortMode = 'newest' | 'oldest' | 'priority'

const PRIORITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

function sortTickets(tickets: SupportTicket[], sort: SortMode) {
  return [...tickets].sort((a, b) => {
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (sort === 'priority') return (PRIORITY_ORDER[b.priority || 'medium'] || 0) - (PRIORITY_ORDER[a.priority || 'medium'] || 0)
    return 0
  })
}

function searchTickets(tickets: SupportTicket[], query: string) {
  if (!query.trim()) return tickets
  const q = query.toLowerCase()
  return tickets.filter(t =>
    t.description.toLowerCase().includes(q) ||
    i18n.t(`support.ticket.category.${t.category}`).toLowerCase().includes(q)
  )
}

export default function Support() {
  const user = useAuthStore((s) => s.user)
  const { users, fetchUsers } = useUserStore()
  const { tickets, isLoading, fetchTickets, createTicket, updateTicket, deleteTicket, addComment } = useSupportStore()

  const settings = useMemo(() => db.getSettings(), [])
  const [category, setCategory] = useState<SupportTicketCategory>('network')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  
  const [activeTab, setActiveTab] = useState<'submit' | 'my_tickets' | 'queue'>('submit')
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicketStatus>('all')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notesByTicket, setNotesByTicket] = useState<Record<string, string>>({})
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({})
  const [selectedRating, setSelectedRating] = useState<Record<string, number>>({})
  const [feedbackTextByTicket, setFeedbackTextByTicket] = useState<Record<string, string>>({})
  const [commentTextByTicket, setCommentTextByTicket] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState<string | null>(null)

  const isIT = hasPermission(user, 'support.manage')

  useEffect(() => {
    fetchUsers()
    fetchTickets()
  }, [fetchUsers, fetchTickets])

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
      } catch { /* Electron API may be unavailable in browser — fall back to navigator info */ }

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

  const handleAssign = useCallback(async (ticketId: string) => {
    if (!user) return
    await updateTicket(ticketId, { assigneeId: user.id, status: 'in_progress' })
  }, [user, updateTicket])

  const handleStatusChange = useCallback(async (ticketId: string, newStatus: SupportTicketStatus) => {
    await updateTicket(ticketId, { status: newStatus })
  }, [updateTicket])

  const handleDeleteTicket = useCallback(async (ticketId: string) => {
    await deleteTicket(ticketId)
    setDeleteConfirmTicket(null)
  }, [deleteTicket])

  const handleAddComment = async (ticketId: string) => {
    const text = commentTextByTicket[ticketId]?.trim()
    if (!text || !user) return
    await addComment(ticketId, user.id, text)
    setCommentTextByTicket(prev => ({ ...prev, [ticketId]: '' }))
  }

  const getUserName = useCallback((id: string | null) => {
    if (!id) return '—'
    return users.find(u => u.id === id)?.name || id
  }, [users])

  const getUserDetails = useCallback((id: string) => {
    return users.find(u => u.id === id)
  }, [users])

  const myTickets = useMemo(() => {
    const base = tickets.filter(t => t.creatorId === user?.id)
    return sortTickets(searchTickets(base, searchQuery), sortMode)
  }, [tickets, user, searchQuery, sortMode])

  const filteredQueue = useMemo(() => {
    const base = tickets.filter(t => {
      if (filterStatus === 'all') return true
      return t.status === filterStatus
    })
    return sortTickets(searchTickets(base, searchQuery), sortMode)
  }, [tickets, filterStatus, searchQuery, sortMode])

  const pendingCount = useMemo(() =>
    tickets.filter(t => t.status !== 'completed').length,
    [tickets]
  )

  const getStatusBadgeVariant = (status: SupportTicketStatus) => {
    switch (status) {
      case 'completed': return 'success' as const
      case 'in_progress': return 'primary' as const
      default: return 'warning' as const
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 font-outfit">
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

      <ConfirmDialog
        isOpen={!!deleteConfirmTicket}
        title={i18n.t('support.action.delete')}
        description={i18n.t('support.action.delete.confirm')}
        onConfirm={() => handleDeleteTicket(deleteConfirmTicket!)}
        onCancel={() => setDeleteConfirmTicket(null)}
      />

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
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {pendingCount}
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

        {/* Search + Sort Bar */}
        {(activeTab === 'my_tickets' || activeTab === 'queue') && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={i18n.t('support.search.placeholder')}
                className="w-full bg-surface/30 border border-border/10 hover:border-border/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none rounded-xl pl-9 pr-3 py-2 text-xs transition-all font-outfit"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground/60" />
              <Select aria-label={i18n.t('support.sort.label')} value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="h-9 rounded-xl bg-surface/30 border border-border/10 hover:border-border/20 text-xs gap-2 min-w-[130px] spring-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{i18n.t('support.sort.newest')}</SelectItem>
                  <SelectItem value="oldest">{i18n.t('support.sort.oldest')}</SelectItem>
                  <SelectItem value="priority">{i18n.t('support.sort.priority')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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
              getUserDetails={getUserDetails}
              hoveredRating={hoveredRating}
              setHoveredRating={setHoveredRating}
              selectedRating={selectedRating}
              setSelectedRating={setSelectedRating}
              feedbackTextByTicket={feedbackTextByTicket}
              setFeedbackTextByTicket={setFeedbackTextByTicket}
              handleFeedbackSubmit={handleFeedbackSubmit}
              handleDeleteTicket={(id) => setDeleteConfirmTicket(id)}
              commentTextByTicket={commentTextByTicket}
              setCommentTextByTicket={setCommentTextByTicket}
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
              handleAddComment={handleAddComment}
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
              handleDeleteTicket={(id) => setDeleteConfirmTicket(id)}
              commentTextByTicket={commentTextByTicket}
              setCommentTextByTicket={setCommentTextByTicket}
              expandedComments={expandedComments}
              setExpandedComments={setExpandedComments}
              handleAddComment={handleAddComment}
            />
          )}
        </div>
      </div>
    </div>
  )
}
