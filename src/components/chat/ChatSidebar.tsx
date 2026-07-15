import React from 'react'
import { Search, UserPlus, Check, X } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, getDepartmentConfig } from '@/lib/constants'
import type { User, ChatRequest } from '@/lib/types'

interface ChatSidebarProps {
  activeTab: 'active' | 'all' | 'requests'
  setActiveTab: (t: 'active' | 'all' | 'requests') => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeContacts: User[]
  selectedContact: User | null
  setSelectedContact: (u: User | null) => void
  relations: Record<string, { status: 'pending' | 'accepted' | 'rejected', requestId: string }>
  filteredUsers: User[]
  chatRequests: ChatRequest[]
  currentUser: User | null
  getColleague: (id: string) => User | undefined
  handleSendRequest: (receiverId: string) => void
  handleAcceptRequest: (requestId: string) => void
  handleDeclineRequest: (requestId: string) => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSelectedContact,
  relations,
  filteredUsers,
  chatRequests,
  currentUser,
  getColleague,
  handleSendRequest,
  handleAcceptRequest,
  handleDeclineRequest,
  activeContacts,
  selectedContact,
  setSearchQuery,
}) => {
  return (
    <div className="w-80 bg-surface/40 backdrop-blur-xl border border-border/10 rounded-2xl p-4 flex flex-col gap-4 shadow-diffusion">
      <h2 className="text-sm font-black text-foreground font-outfit uppercase tracking-wider">{i18n.t('chat.contacts')}</h2>
      
      {/* Premium Pill Tab Headers */}
      <div className="flex bg-muted/40 p-1 rounded-2xl border border-border/10 gap-1">
        {(['active', 'all', 'requests'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-xl transition-all duration-200 active:scale-[0.96] cursor-pointer ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground/80 hover:text-foreground hover:bg-background/10'
            }`}
          >
            {i18n.t(`chat.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Search Input with Glassmorphism */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/40 rtl:left-auto rtl:right-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={i18n.t('chat.search')}
          className="pl-9 h-9 rounded-xl bg-background/50 border-border/10 focus:border-primary/40 focus:bg-background/80 rtl:pl-3 rtl:pr-9 text-xs transition-[border-color,background] duration-200"
        />
      </div>

      {/* Tab Lists */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
        {activeTab === 'active' && (
          activeContacts.length === 0 ? (
            <div className="text-center py-12 text-caption text-muted-foreground">
              {i18n.t('chat.no_active_chats')}
            </div>
          ) : (
            activeContacts
              .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((contact, index) => {
                const isSelected = selectedContact?.id === contact.id
                return (
                  <button
                    key={contact.id}
                    style={{ animationDelay: `${index * 40}ms` }}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left rtl:text-right cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                      isSelected 
                        ? 'border-primary-100/50 bg-primary-50 text-foreground dark:border-primary/20 dark:bg-primary/10' 
                        : 'border-transparent hover:bg-background/25 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 ring-2 ring-background">
                        {contact.avatar && <AvatarImage src={contact.avatar} alt={contact.name} />}
                        <AvatarFallback className="bg-primary-500 text-primary-foreground text-xs font-bold font-outfit">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Green online status indicator dot */}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{contact.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{contact.username} • {contact.department ? i18n.t(getDepartmentConfig(contact.department).label) : ''}
                      </p>
                    </div>
                  </button>
                )
              })
          )
        )}

        {activeTab === 'all' && (
          filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-caption text-muted-foreground">
              {i18n.t('chat.no_colleagues_match')}
            </div>
          ) : (
            filteredUsers.map((colleague) => {
              const relation = relations[colleague.id]
              return (
                <div
                  key={colleague.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/10 bg-background/20 hover:bg-background/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                      {colleague.avatar && <AvatarImage src={colleague.avatar} alt={colleague.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold font-outfit">
                        {getInitials(colleague.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{colleague.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">@{colleague.username}</p>
                    </div>
                  </div>

                  <div>
                    {!relation ? (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(colleague.id)}
                        className="h-7 rounded-full text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/90 active:scale-[0.96] transition-transform duration-100 ease-out shadow-sm shadow-primary/10"
                      >
                        <UserPlus className="h-3 w-3" />
                        {i18n.t('chat.request.send')}
                      </Button>
                    ) : relation.status === 'pending' ? (
                      <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 animate-pulse bg-muted/30 border-border/20 text-muted-foreground">
                        {i18n.t('chat.request.pending')}
                      </Badge>
                    ) : relation.status === 'accepted' ? (
                      <Badge variant="success" className="text-[10px] px-2.5 py-0.5">
                        {i18n.t('chat.request.accepted')}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(colleague.id)}
                        className="h-7 rounded-full text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/90 active:scale-[0.96] transition-transform duration-100 ease-out shadow-sm shadow-primary/10"
                      >
                        {i18n.t('chat.request.send')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )
        )}

        {activeTab === 'requests' && (
          chatRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-12 text-caption text-muted-foreground">
              {i18n.t('chat.no_pending_requests')}
            </div>
          ) : (
            chatRequests
              .filter(r => r.status === 'pending')
              .map((req) => {
                const isReceived = req.receiverId === currentUser?.id
                const targetUser = getColleague(isReceived ? req.senderId : req.receiverId)
                if (!targetUser) return null
                
                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border border-border/10 bg-background/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {targetUser.avatar && <AvatarImage src={targetUser.avatar} alt={targetUser.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold font-outfit">
                          {getInitials(targetUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{targetUser.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {isReceived ? i18n.t('chat.request.incoming') : i18n.t('chat.request.pending')}
                        </p>
                      </div>
                    </div>

                    {isReceived && (
                      <div className="flex gap-2 w-full mt-1">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 h-7 rounded-full text-[10px] font-bold bg-success hover:bg-success/90 text-success-foreground active:scale-[0.96] transition-transform duration-100"
                        >
                          <Check className="h-3 w-3" />
                          {i18n.t('chat.action.accept')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="flex-1 h-7 rounded-full text-[10px] font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground active:scale-[0.96] transition-transform duration-100"
                        >
                          <X className="h-3 w-3" />
                          {i18n.t('chat.action.decline')}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
          )
        )}
      </div>
    </div>
  )
}
