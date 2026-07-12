import React from 'react'
import { Phone, Video, Send, MessageSquare } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { getInitials } from '@/lib/constants'
import type { User, ChatMessage } from '@/lib/types'

interface ChatWindowProps {
  selectedContact: User | null
  currentUser: User | null
  messages: ChatMessage[]
  messageText: string
  setMessageText: (t: string) => void
  handleSendMessage: (e: React.FormEvent) => void
  initiateCall: (type: 'voice' | 'video') => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedContact,
  currentUser,
  messages,
  messageText,
  setMessageText,
  handleSendMessage,
  initiateCall,
  messagesEndRef,
}) => {
  if (!selectedContact) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title={i18n.t('chat.title')}
          description={i18n.t('chat.select_to_start')}
          icon={<MessageSquare className="h-8 w-8 text-primary" />}
        />
      </div>
    )
  }

  return (
    <>
      {/* Header: user status + Call Controls */}
      <div className="px-6 py-4 border-b border-border/10 bg-background/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {selectedContact.avatar && <AvatarImage src={selectedContact.avatar} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold font-outfit">
              {getInitials(selectedContact.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-left rtl:text-right">
            <span className="text-xs font-black text-foreground">{selectedContact.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {selectedContact.title || (selectedContact.role === 'admin' ? 'System Administrator' : 'Staff')}
            </span>
          </div>
        </div>

        {/* Call triggers */}
        <div className="flex gap-2">
          <Button
            onClick={() => initiateCall('voice')}
            variant="secondary"
            size="sm"
            className="rounded-xl h-9 w-9 p-0 bg-background border-border/10 hover:border-border/20 text-foreground hover:bg-primary/5 hover:text-primary cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => initiateCall('video')}
            variant="secondary"
            size="sm"
            className="rounded-xl h-9 w-9 p-0 bg-background border-border/10 hover:border-border/20 text-foreground hover:bg-primary/5 hover:text-primary cursor-pointer active:scale-[0.95] transition-all duration-150 ease-out"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversation Log */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-caption text-muted-foreground p-6 leading-relaxed">
            {i18n.t('chat.no_messages')}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser?.id
            return (
              <div
                key={msg.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-rise`}
              >
                <div
                  className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isOwn
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm shadow-primary/10'
                      : 'bg-muted/40 border border-border/5 text-foreground rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-outfit">{msg.text}</p>
                  <span className="block text-[8px] text-right mt-1 opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString(i18n.lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border/10 bg-background/25 flex gap-2">
        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder={i18n.t('chat.placeholder')}
          className="flex-1 h-10 rounded-xl bg-background border-border/10 focus:border-primary/50 text-xs"
        />
        <Button
          type="submit"
          disabled={!messageText.trim()}
          className="h-10 px-4 rounded-xl cursor-pointer bg-primary text-primary-foreground font-bold active:scale-[0.96] transition-transform duration-100 ease-out"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">{i18n.t('chat.action.send')}</span>
        </Button>
      </form>
    </>
  )
}
