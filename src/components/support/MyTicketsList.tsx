import React from 'react'
import { LifeBuoy, Star, User } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import { hasPermission } from '@/lib/utils'
import type { SupportTicket, User as UserType } from '@/lib/types'

interface MyTicketsListProps {
  myTickets: SupportTicket[]
  isLoading: boolean
  user: UserType | null
  settings: any
  getStatusBadgeVariant: (status: any) => any
  setExpandedImage: (img: string) => void
  getUserName: (id: string | null) => string
  hoveredRating: Record<string, number>
  setHoveredRating: (r: Record<string, number>) => void
  selectedRating: Record<string, number>
  setSelectedRating: (r: Record<string, number>) => void
  feedbackTextByTicket: Record<string, string>
  setFeedbackTextByTicket: (f: Record<string, string>) => void
  handleFeedbackSubmit: (ticketId: string) => void
}

export const MyTicketsList: React.FC<MyTicketsListProps> = ({
  myTickets,
  isLoading,
  user,
  settings,
  getStatusBadgeVariant,
  setExpandedImage,
  getUserName,
  hoveredRating,
  setHoveredRating,
  selectedRating,
  setSelectedRating,
  feedbackTextByTicket,
  setFeedbackTextByTicket,
  handleFeedbackSubmit,
}) => {
  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : myTickets.length === 0 ? (
        <EmptyState
          title={i18n.t('support.ticket.no_tickets')}
          description={i18n.t('support.ticket.no_tickets_desc')}
          icon={<LifeBuoy className="h-8 w-8 text-primary" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myTickets.map((ticket, index) => (
            <div 
              key={ticket.id} 
              style={{ animationDelay: `${index * 40}ms` }}
              className="animate-rise bg-surface/30 border border-border/10 rounded-xl p-5 hover:shadow-md hover:scale-[1.005] hover:border-border/20 transition-all duration-300 relative flex flex-col gap-3"
            >
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
                  {new Date(ticket.createdAt).toLocaleString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US')}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {i18n.t(`support.ticket.category.${ticket.category}`)}
                </h3>
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
                  <span className="italic">{i18n.t('support.ticket.awaiting_assignment')}</span>
                )}

                {ticket.deviceInfo && settings.supportEnableDiagnostics && hasPermission(user, 'support.diagnostics') && (
                  <span className="flex items-center gap-1 text-primary/70 font-medium" title={ticket.systemLog || ''}>
                    ⚙️ {ticket.deviceInfo.length > 60 ? ticket.deviceInfo.slice(0, 60) + '…' : ticket.deviceInfo}
                  </span>
                )}
              </div>

              {/* Resolution Notes for User View */}
              {settings.supportEnableResolutionNotes && hasPermission(user, 'support.resolution_notes') && ticket.resolutionNotes && (
                <div className="mt-2 bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="font-bold text-primary flex items-center gap-1.5 mb-1">
                    <span>💡</span>
                    <span>{i18n.t('support.resolution_notes')}</span>
                  </div>
                  <p className="text-foreground/85 whitespace-pre-wrap font-outfit">{ticket.resolutionNotes}</p>
                </div>
              )}

              {/* Feedback & Rating Section on Creator View */}
              {settings.supportEnableFeedback && hasPermission(user, 'support.feedback') && ticket.status === 'completed' && (
                <div className="mt-2 border-t border-border/5 pt-3">
                  {ticket.rating ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground/75">{i18n.t('support.feedback.rating')}:</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < ticket.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35'}`} 
                          />
                        ))}
                      </div>
                      {ticket.feedbackText && (
                        <span className="text-xs italic text-muted-foreground pl-2 rtl:pr-2 rtl:pl-0">
                          "{ticket.feedbackText}"
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 bg-muted/10 border border-border/5 rounded-xl p-4 animate-rise">
                      <span className="text-xs font-bold text-foreground/85">{i18n.t('support.feedback.rate')}</span>
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex gap-1.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starVal = i + 1
                            const isHovered = (hoveredRating[ticket.id] || 0) >= starVal
                            const isSelected = (selectedRating[ticket.id] || 0) >= starVal
                            return (
                              <button
                                key={i}
                                type="button"
                                onMouseEnter={() => setHoveredRating({ ...hoveredRating, [ticket.id]: starVal })}
                                onMouseLeave={() => setHoveredRating({ ...hoveredRating, [ticket.id]: 0 })}
                                onClick={() => setSelectedRating({ ...selectedRating, [ticket.id]: starVal })}
                                className="cursor-pointer transition-transform duration-100 hover:scale-125"
                              >
                                <Star 
                                  className={`h-5 w-5 transition-colors duration-150 ${
                                    isHovered || isSelected ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'
                                  }`} 
                                />
                              </button>
                            )
                          })}
                        </div>

                        <div className="flex-1 flex gap-2">
                          <Input 
                            value={feedbackTextByTicket[ticket.id] || ''}
                            onChange={(e) => setFeedbackTextByTicket({ ...feedbackTextByTicket, [ticket.id]: e.target.value })}
                            placeholder={i18n.t('support.feedback.placeholder')}
                            className="h-8 text-xs bg-background/50 rounded-xl"
                          />
                          <Button
                            onClick={() => handleFeedbackSubmit(ticket.id)}
                            disabled={!(selectedRating[ticket.id] > 0)}
                            className="h-8 text-xs font-bold px-3 py-1 bg-primary text-primary-foreground rounded-xl active:scale-[0.96] transition-transform duration-100"
                          >
                            {i18n.t('support.feedback.submit')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
