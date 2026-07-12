import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl animate-rise max-w-md mx-auto my-8 border border-border/10">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/30 text-muted-foreground/60 mb-4 border border-border/5">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground/80 max-w-[280px] mb-5 leading-normal">
        {description}
      </p>
      {actionText && onAction && (
        <Button 
          onClick={onAction} 
          className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground spring-transition shadow-lg shadow-primary/10 active:scale-[0.97]"
        >
          {actionText}
        </Button>
      )}
    </div>
  )
}
