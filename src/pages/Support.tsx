import { useState, useEffect, useRef } from 'react'
import {
  LifeBuoy, Wrench, Clock, User, AlertCircle, CheckCircle2, Upload, X
} from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useSupportStore } from '@/stores/supportStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDepartmentConfig } from '@/lib/constants'
import type { SupportTicketCategory, SupportTicketStatus } from '@/lib/types'

const CATEGORIES: SupportTicketCategory[] = ['network', 'software', 'hardware', 'email_account', 'other']

export default function Support() {
  const user = useAuthStore((s) => s.user)
  const { users, fetchUsers } = useUserStore()
  const { tickets, isLoading, fetchTickets, createTicket, updateTicket } = useSupportStore()

  const [category, setCategory] = useState<SupportTicketCategory>('network')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  
  const [activeTab, setActiveTab] = useState<'submit' | 'my_tickets' | 'queue'>('submit')
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicketStatus>('all')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isIT = user?.department === 'it'

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
        setError(i18n.lang === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' : 'Image size must be less than 2MB')
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
        setError(i18n.lang === 'ar' ? 'فشل تحميل الصورة' : 'Failed to upload image')
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
      setError(i18n.lang === 'ar' ? 'يرجى كتابة شرح للمشكلة' : 'Please provide a description')
      return
    }

    if (!user) return

    setSubmitting(true)
    try {
      await createTicket({
        creatorId: user.id,
        category,
        description: description.trim(),
        image: image || undefined,
        reminderDate: reminderDate || undefined,
      })
      setSuccess(true)
      setDescription('')
      setImage('')
      setReminderDate('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Auto redirect to My Tickets tab after success
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

  // Filter logic
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
          {/* Tab 1: Submit Form */}
          {activeTab === 'submit' && (
            <div className="animate-rise w-full bg-surface/40 backdrop-blur-xl border border-border/10 rounded-2xl shadow-diffusion p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="animate-rise flex items-center gap-2 text-destructive bg-destructive/10 p-3.5 rounded-xl text-caption">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="animate-rise flex items-center gap-2 text-emerald-600 bg-emerald-500/10 p-3.5 rounded-xl text-caption">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{i18n.t('support.form.success')}</span>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-caption font-bold text-foreground">{i18n.t('support.form.category')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.96] hover:scale-[1.01] hover:shadow-sm ${
                            isSelected 
                              ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/5' 
                              : 'border-border/10 hover:border-border/30 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Wrench className="h-5 w-5" />
                          <span className="text-xs font-bold">{i18n.t(`support.ticket.category.${cat}`)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-caption font-bold text-foreground">{i18n.t('support.form.description')}</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={i18n.t('support.form.description_placeholder')}
                    rows={4}
                    className="w-full bg-background border border-border/10 hover:border-border/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none rounded-xl p-3.5 text-sm leading-relaxed transition-all resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-caption font-bold text-foreground">{i18n.t('support.form.image')}</label>
                  {!image ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border/15 hover:border-border/30 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 active:scale-[0.99] hover:bg-background/10 bg-background/5"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground/60" />
                      <span className="text-caption text-muted-foreground">{i18n.t('support.form.image_placeholder')}</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </div>
                  ) : (
                    <div className="relative inline-block group">
                      <img src={image} alt="Preview" className="h-28 w-28 object-cover rounded-xl border border-border/10" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-1.5 -right-1.5 bg-destructive hover:bg-destructive-hover text-white p-1 rounded-full shadow-md transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Reminder Date */}
                <div className="space-y-2">
                  <label className="text-caption font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {i18n.t('support.form.reminder')}
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full max-w-xs bg-background border border-border/10 hover:border-border/20 focus:border-primary/50 outline-none rounded-xl px-3.5 py-2.5 text-sm transition-all"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={submitting} className="rounded-xl px-6 py-2.5 font-bold shadow-md shadow-primary/10 transition-all duration-150 active:scale-[0.97]">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                        ...
                      </span>
                    ) : i18n.t('support.form.submit')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: My Tickets */}
          {activeTab === 'my_tickets' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border/10 rounded-2xl p-12 text-center bg-background/5">
                  <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">{i18n.t('support.ticket.no_tickets')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myTickets.map((ticket, index) => (
                    <div 
                      key={ticket.id} 
                      style={{ animationDelay: `${index * 40}ms` }}
                      className="animate-rise bg-surface/30 border border-border/10 rounded-xl p-5 hover:shadow-md hover:scale-[1.005] hover:border-border/20 transition-all duration-300 relative flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {i18n.t(`support.status.${ticket.status}`)}
                        </Badge>
                        <span className="text-micro text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {i18n.t(`support.ticket.category.${ticket.category}`)}
                        </h4>
                        <p className="text-caption text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Attached thumbnail */}
                      {ticket.image && (
                        <div>
                          <button 
                            type="button" 
                            onClick={() => setExpandedImage(ticket.image!)}
                            className="h-14 w-14 rounded-lg overflow-hidden border border-border/10 hover:opacity-85 transition-opacity cursor-zoom-in"
                          >
                            <img src={ticket.image} alt="Attachment" className="h-full w-full object-cover" />
                          </button>
                        </div>
                      )}

                      {/* Footer/Details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/5 pt-3 mt-1 text-micro text-muted-foreground">
                        {ticket.assigneeId ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {i18n.t('support.ticket.assigned_to').replace('{name}', getUserName(ticket.assigneeId))}
                          </span>
                        ) : (
                          <span className="italic">{i18n.lang === 'ar' ? 'بانتظار مستلم فني' : 'Awaiting assignment'}</span>
                        )}

                        {ticket.reminderDate && (
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            {i18n.t('support.ticket.reminder').replace('{date}', new Date(ticket.reminderDate).toLocaleString())}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: IT Queue (Only for IT department users) */}
          {activeTab === 'queue' && isIT && (
            <div className="space-y-6">
              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => {
                  const isActive = filterStatus === status
                  const count = status === 'all' 
                    ? tickets.length 
                    : tickets.filter(t => t.status === status).length

                  return (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-full border transition-all duration-150 active:scale-[0.95] cursor-pointer ${
                        isActive
                          ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10'
                          : 'bg-surface/20 border-border/10 text-muted-foreground hover:text-foreground hover:bg-surface/40'
                      }`}
                    >
                      {status === 'all' ? (i18n.lang === 'ar' ? 'الكل' : 'All') : i18n.t(`support.status.${status}`)}
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Tickets List */}
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border/10 rounded-2xl p-12 text-center bg-background/5">
                  <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground">{i18n.t('support.ticket.no_tickets')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredQueue.map((ticket, index) => {
                    const creator = getUserDetails(ticket.creatorId)
                    const assignee = getUserDetails(ticket.assigneeId || '')

                    return (
                      <div 
                        key={ticket.id} 
                        style={{ animationDelay: `${index * 40}ms` }}
                        className="animate-rise bg-surface/40 backdrop-blur-xl border border-border/10 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:scale-[1.005] hover:border-border/20 transition-all duration-300 relative"
                      >
                        {/* Status + Date */}
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {i18n.t(`support.status.${ticket.status}`)}
                          </Badge>
                          <span className="text-micro text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        </div>

                        {/* Ticket Content */}
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-base font-black text-foreground">
                              {i18n.t(`support.ticket.category.${ticket.category}`)}
                            </h4>
                          </div>
                          
                          {/* Submitter User Profile Card */}
                          <div className="flex items-center gap-2 mt-2 bg-background/10 p-2.5 rounded-xl border border-border/5">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                              {creator ? creator.name.slice(0, 2) : 'EM'}
                            </div>
                            <div className="flex flex-col text-left rtl:text-right">
                              <span className="text-xs font-bold text-foreground leading-none">{creator?.name || 'Employee'}</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                @{creator?.username || 'user'} • {creator?.department ? i18n.t(getDepartmentConfig(creator.department).label) : ''}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-foreground/80 mt-3 leading-relaxed whitespace-pre-wrap border-l-2 border-primary/20 pl-2 rtl:border-l-0 rtl:border-r-2 rtl:pl-0 rtl:pr-2">
                            {ticket.description}
                          </p>
                        </div>

                        {/* Image Preview */}
                        {ticket.image && (
                          <div>
                            <button 
                              type="button" 
                              onClick={() => setExpandedImage(ticket.image!)}
                              className="h-16 w-16 rounded-xl overflow-hidden border border-border/10 hover:opacity-85 transition-opacity cursor-zoom-in"
                            >
                              <img src={ticket.image} alt="Attachment" className="h-full w-full object-cover" />
                            </button>
                          </div>
                        )}

                        {/* Reminder Metadata */}
                        {ticket.reminderDate && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl w-fit">
                            <Clock className="h-4 w-4" />
                            {i18n.t('support.ticket.reminder').replace('{date}', new Date(ticket.reminderDate).toLocaleString())}
                          </div>
                        )}

                        {/* Actions for IT Staff */}
                        <div className="flex flex-wrap gap-2 border-t border-border/5 pt-4 mt-auto">
                          {!ticket.assigneeId ? (
                            <Button 
                              onClick={() => handleAssign(ticket.id)}
                              size="sm" 
                              className="rounded-xl font-bold bg-primary hover:bg-primary/95 shadow-sm text-xs cursor-pointer px-4 py-1.5 active:scale-[0.96] transition-transform duration-150 ease-out"
                            >
                              {i18n.t('support.action.assign')}
                            </Button>
                          ) : (
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="text-micro text-muted-foreground flex items-center gap-1.5 bg-background/5 px-3 py-1.5 rounded-lg border border-border/5">
                                <User className="h-3.5 w-3.5" />
                                {i18n.t('support.ticket.assigned_to').replace('{name}', assignee?.name || 'IT')}
                              </span>

                              {ticket.assigneeId === user?.id && ticket.status !== 'completed' && (
                                <div className="flex gap-1.5">
                                  {ticket.status === 'pending' && (
                                    <Button 
                                      onClick={() => handleStatusChange(ticket.id, 'in_progress')}
                                      size="sm" 
                                      className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs px-4 py-1.5 active:scale-[0.96] transition-transform duration-150 ease-out"
                                    >
                                      {i18n.t('support.action.start')}
                                    </Button>
                                  )}
                                  {ticket.status === 'in_progress' && (
                                    <Button 
                                      onClick={() => handleStatusChange(ticket.id, 'completed')}
                                      size="sm" 
                                      className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs px-4 py-1.5 active:scale-[0.96] transition-transform duration-150 ease-out"
                                    >
                                      {i18n.t('support.action.resolve')}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
