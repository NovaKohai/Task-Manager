import React from 'react'
import { LifeBuoy, Star, User, Trash2, MessageSquare, Send } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import { getDepartmentConfig } from '@/lib/constants'
import { hasPermission } from '@/lib/utils'
import type { SupportTicket, SupportTicketStatus, User as UserType } from '@/lib/types'

interface ItQueueManagerProps {
  tickets: SupportTicket[]
  filteredQueue: SupportTicket[]
  isLoading: boolean
  user: UserType | null
  settings: any
  getStatusBadgeVariant: (status: any) => any
  setExpandedImage: (img: string) => void
  getUserDetails: (id: string) => UserType | undefined
  filterStatus: 'all' | SupportTicketStatus
  setFilterStatus: (status: 'all' | SupportTicketStatus) => void
  notesByTicket: Record<string, string>
  setNotesByTicket: (n: Record<string, string>) => void
  handleAssign: (id: string) => void
  handleResolve: (id: string) => void
  handleStatusChange: (id: string, status: SupportTicketStatus) => void
  handleDeleteTicket: (ticketId: string) => void
  commentTextByTicket: Record<string, string>
  setCommentTextByTicket: (f: Record<string, string>) => void
  expandedComments: Record<string, boolean>
  setExpandedComments: (f: Record<string, boolean>) => void
  handleAddComment: (ticketId: string) => void
}

export const ItQueueManager: React.FC<ItQueueManagerProps> = ({
  tickets,
  filteredQueue,
  isLoading,
  user,
  settings,
  getStatusBadgeVariant,
  setExpandedImage,
  getUserDetails,
  filterStatus,
  setFilterStatus,
  notesByTicket,
  setNotesByTicket,
  handleAssign,
  handleResolve,
  handleStatusChange,
  handleDeleteTicket,
  commentTextByTicket,
  setCommentTextByTicket,
  expandedComments,
  setExpandedComments,
  handleAddComment,
}) => {
  return (
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
              {status === 'all' ? i18n.t('support.ticket.all') : i18n.t(`support.status.${status}`)}
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
        <EmptyState
          title={i18n.t('support.ticket.no_tickets')}
          description={i18n.t('support.ticket.no_match_desc')}
          icon={<LifeBuoy className="h-8 w-8 text-primary" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredQueue.map((ticket, index) => {
            const creator = getUserDetails(ticket.creatorId)
            const assignee = getUserDetails(ticket.assigneeId || '')

            return (
              <div 
                key={ticket.id} 
                style={{ animationDelay: `${index * 40}ms` }}
                className="animate-rise bg-surface/40 backdrop-blur-xl border border-border/10 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:scale-[1.005] hover:border-border/20 transition-all duration-300 relative group"
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteTicket(ticket.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  title={i18n.t('support.action.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Status + Date */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-1.5 items-center">
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {i18n.t(`support.status.${ticket.status}`)}
                    </Badge>
                    {settings.supportEnablePriority && hasPermission(user, 'support.priority') && ticket.priority && (
                      <Badge variant={ticket.priority === 'critical' ? 'danger' : ticket.priority === 'high' ? 'warning' : 'outline'}>
                        {i18n.t(`support.priority.${ticket.priority}`)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-micro text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString(i18n.localeStr)}
                  </span>
                </div>

                {/* Ticket Content */}
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-foreground">
                      {i18n.t(`support.ticket.category.${ticket.category}`)}
                    </h3>
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

                {/* Device Info */}
                {ticket.deviceInfo && settings.supportEnableDiagnostics && hasPermission(user, 'support.diagnostics') && (
                  <div className="flex items-start gap-1.5 text-xs text-primary/80 font-semibold bg-primary/5 border border-primary/10 p-2.5 rounded-xl w-fit">
                    <span>⚙️</span>
                    <div className="flex flex-col gap-0.5">
                      <span>{ticket.deviceInfo}</span>
                      {ticket.systemLog && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                            {i18n.t('support.diagnostics.view_log')}
                          </summary>
                          <pre className="mt-1 text-[10px] text-muted-foreground bg-background/50 rounded-lg p-2 max-h-32 overflow-auto whitespace-pre-wrap font-mono">{ticket.systemLog}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution Notes for IT Queue View */}
                {settings.supportEnableResolutionNotes && hasPermission(user, 'support.resolution_notes') && (
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">{i18n.t('support.resolution_notes')}</label>
                    {ticket.status !== 'completed' ? (
                      <textarea
                        value={notesByTicket[ticket.id] ?? ticket.resolutionNotes ?? ''}
                        onChange={(e) => setNotesByTicket({ ...notesByTicket, [ticket.id]: e.target.value })}
                        placeholder={i18n.t('support.resolution_notes.placeholder')}
                        rows={2}
                        className="w-full bg-background border border-border/10 hover:border-border/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none rounded-xl p-2.5 text-xs transition-all resize-none font-outfit"
                      />
                    ) : (
                      ticket.resolutionNotes && (
                        <div className="p-3 bg-muted/20 border border-border/5 rounded-xl text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap font-outfit">
                          {ticket.resolutionNotes}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div className="border-t border-border/5 pt-3 mt-1">
                  <button
                    onClick={() => setExpandedComments({ ...expandedComments, [ticket.id]: !expandedComments[ticket.id] })}
                    className="flex items-center gap-1.5 text-micro text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{i18n.t('support.comments.title')} ({(ticket.comments || []).length})</span>
                  </button>

                  {expandedComments[ticket.id] && (
                    <div className="mt-3 space-y-3 animate-rise">
                      {(ticket.comments || []).length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/60 italic">{i18n.t('support.comments.empty')}</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {ticket.comments!.map((c) => {
                            const author = getUserDetails(c.authorId)
                            return (
                              <div key={c.id} className="flex items-start gap-2 bg-background/20 rounded-lg p-2.5 border border-border/5">
                                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                                  {author ? author.name.slice(0, 2) : '??'}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-foreground">{author?.name || 'Unknown'}</span>
                                    <span className="text-[9px] text-muted-foreground/60">{new Date(c.createdAt).toLocaleString(i18n.localeStr)}</span>
                                  </div>
                                  <p className="text-[11px] text-foreground/80 mt-0.5">{c.text}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          value={commentTextByTicket[ticket.id] || ''}
                          onChange={(e) => setCommentTextByTicket({ ...commentTextByTicket, [ticket.id]: e.target.value })}
                          placeholder={i18n.t('support.comments.placeholder')}
                          className="h-8 text-xs bg-background/50 rounded-xl flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleAddComment(ticket.id)
                            }
                          }}
                        />
                        <Button
                          onClick={() => handleAddComment(ticket.id)}
                          disabled={!commentTextByTicket[ticket.id]?.trim()}
                          className="h-8 w-8 p-0 bg-primary text-primary-foreground rounded-xl shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating Display in IT Queue */}
                {settings.supportEnableFeedback && hasPermission(user, 'support.feedback') && ticket.status === 'completed' && ticket.rating && (
                  <div className="flex flex-col gap-1.5 bg-muted/10 border border-border/5 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{i18n.t('support.feedback.rating')}:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3.5 w-3.5 ${i < ticket.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    {ticket.feedbackText && (
                      <p className="text-caption italic text-muted-foreground/90 font-outfit">
                        "{ticket.feedbackText}"
                      </p>
                    )}
                  </div>
                )}

                {/* Actions for IT Staff */}
                <div className="flex flex-wrap gap-2 border-t border-border/5 pt-4 mt-auto">
                  {!ticket.assigneeId ? (
                    <Button 
                      onClick={() => handleAssign(ticket.id)}
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
                              className="rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm text-xs px-4 py-1.5 active:scale-[0.96] transition-transform duration-150 ease-out"
                            >
                              {i18n.t('support.action.start')}
                            </Button>
                          )}
                          {ticket.status === 'in_progress' && (
                            <Button 
                              onClick={() => handleResolve(ticket.id)}
                              className="rounded-xl font-bold bg-success hover:bg-success/95 text-success-foreground shadow-sm text-xs px-4 py-1.5 active:scale-[0.96] transition-transform duration-150 ease-out"
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
  )
}
