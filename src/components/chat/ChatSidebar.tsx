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
  setSearchQuery,
  activeContacts,
  selectedContact,
  setSelectedContact,
  relations,
  filteredUsers,
  chatRequests,
  currentUser,
  getColleague,
  handleSendRequest,
  handleAcceptRequest,
  handleDeclineRequest,
}) => {
  return (
    <div className="w-80 bg-surface/30 backdrop-blur-xl border border-border/10 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
      <h2 className="text-base font-black text-foreground font-outfit uppercase tracking-wider">{i18n.t('chat.contacts')}</h2>
      
      {/* Tab Headers */}
      <div className="flex bg-muted/30 rounded-xl p-1 gap-1 border border-border/5">
        {(['active', 'all', 'requests'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center py-2 text-micro font-bold rounded-lg transition-all duration-150 active:scale-[0.96] ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
            }`}
          >
            {i18n.t(`chat.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60 rtl:left-auto rtl:right-3" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={i18n.t('chat.search')}
          className="pl-9 h-9 rounded-xl bg-background/50 border-border/10 hover:border-border/20 rtl:pl-3 rtl:pr-9 text-xs"
        />
      </div>

      {/* Tab Lists */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
        {activeTab === 'active' && (
          activeContacts.length === 0 ? (
            <div className="text-center py-10 text-caption text-muted-foreground">
              {i18n.lang === 'ar' ? 'لا توجد محادثات نشطة بعد' : 'No active chats yet'}
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
                        ? 'border-primary bg-primary/5 text-foreground' 
                        : 'border-transparent hover:bg-background/20 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      {contact.avatar && <AvatarImage src={contact.avatar} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold font-outfit">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
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
            <div className="text-center py-10 text-caption text-muted-foreground">
              {i18n.lang === 'ar' ? 'لا يوجد موظفون يطابقون البحث' : 'No colleagues match search'}
            </div>
          ) : (
            filteredUsers.map((colleague) => {
              const relation = relations[colleague.id]
              return (
                <div
                  key={colleague.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/5 bg-background/10 hover:bg-background/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8">
                      {colleague.avatar && <AvatarImage src={colleague.avatar} />}
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold font-outfit">
                        {getInitials(colleague.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{colleague.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">@{colleague.username}</p>
                    </div>
                  </div>

                  <div>
                    {!relation ? (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(colleague.id)}
                        className="h-7 rounded-lg text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/95 active:scale-[0.96] transition-transform duration-100 ease-out"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {i18n.t('chat.request.send')}
                      </Button>
                    ) : relation.status === 'pending' ? (
                      <Badge variant="outline" className="text-[9px] px-2 py-0.5 animate-pulse bg-muted/20 border-border/20">
                        {i18n.t('chat.request.pending')}
                      </Badge>
                    ) : relation.status === 'accepted' ? (
                      <Badge variant="success" className="text-[9px] px-2 py-0.5">
                        {i18n.t('chat.request.accepted')}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendRequest(colleague.id)}
                        className="h-7 rounded-lg text-[10px] font-bold px-3 py-1 cursor-pointer bg-primary hover:bg-primary/95 active:scale-[0.96] transition-transform duration-100 ease-out"
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
            <div className="text-center py-10 text-caption text-muted-foreground">
              {i18n.lang === 'ar' ? 'لا توجد طلبات معلقة حالياً' : 'No pending requests'}
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
                    className="p-3 rounded-xl border border-border/5 bg-background/20 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8">
                        {targetUser.avatar && <AvatarImage src={targetUser.avatar} />}
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold font-outfit">
                          {getInitials(targetUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{targetUser.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {isReceived ? i18n.t('chat.request.incoming') : i18n.t('chat.request.pending')}
                        </p>
                      </div>
                    </div>

                    {isReceived && (
                      <div className="flex gap-2 w-full mt-1">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="flex-1 h-7 rounded-lg text-[10px] font-bold bg-success hover:bg-success/95 text-success-foreground active:scale-[0.96] transition-transform duration-100"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {i18n.t('chat.action.accept')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="flex-1 h-7 rounded-lg text-[10px] font-bold bg-destructive hover:bg-destructive-hover text-destructive-foreground active:scale-[0.96] transition-transform duration-100"
                        >
                          <X className="h-3.5 w-3.5" />
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
