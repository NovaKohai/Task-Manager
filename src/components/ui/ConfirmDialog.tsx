import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { i18n } from '@/lib/i18n'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-md rounded-2xl glass-panel animate-rise p-6">
        <DialogHeader className={i18n.lang === 'ar' ? 'text-right' : 'text-left'}>
          <DialogTitle className="text-base font-bold text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/80 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={`mt-4 gap-2 flex ${i18n.lang === 'ar' ? 'flex-row-reverse justify-start' : 'flex-row justify-end'}`}>
          <Button 
            onClick={onCancel} 
            variant="ghost" 
            className="h-9 px-4 rounded-xl text-xs font-semibold spring-transition active:scale-[0.97]"
          >
            {cancelText || (i18n.lang === 'ar' ? 'إلغاء' : 'Cancel')}
          </Button>
          <Button 
            onClick={onConfirm} 
            variant={variant} 
            className="h-9 px-4 rounded-xl text-xs font-semibold spring-transition active:scale-[0.97]"
          >
            {confirmText || (i18n.lang === 'ar' ? 'تأكيد' : 'Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
