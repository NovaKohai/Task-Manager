import React from 'react'
import { AlertCircle, CheckCircle2, Clock, Upload, Wrench, X } from 'lucide-react'
import { i18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { hasPermission } from '@/lib/utils'
import type { SupportTicketCategory, Priority, User } from '@/lib/types'

const CATEGORIES: SupportTicketCategory[] = ['network', 'software', 'hardware', 'email_account', 'other']

interface TicketSubmitFormProps {
  category: SupportTicketCategory
  setCategory: (c: SupportTicketCategory) => void
  description: string
  setDescription: (d: string) => void
  image: string
  priority: Priority
  setPriority: (p: Priority) => void
  error: string
  success: boolean
  submitting: boolean
  handleSubmit: (e: React.FormEvent) => void
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveImage: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  settings: any
  user: User | null
}

export const TicketSubmitForm: React.FC<TicketSubmitFormProps> = ({
  category,
  setCategory,
  description,
  setDescription,
  image,
  priority,
  setPriority,
  error,
  success,
  submitting,
  handleSubmit,
  handleImageChange,
  handleRemoveImage,
  fileInputRef,
  settings,
  user,
}) => {
  return (
    <div className="animate-rise w-full bg-surface/40 backdrop-blur-xl border border-border/10 rounded-2xl shadow-diffusion p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="animate-rise flex items-center gap-2 text-destructive bg-destructive/10 p-3.5 rounded-xl text-caption">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="animate-rise flex items-center gap-2 text-success bg-success/10 p-3.5 rounded-xl text-caption">
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

        {/* Priority Selection - Gated */}
        {settings.supportEnablePriority && hasPermission(user, 'support.priority') && (
          <div className="space-y-2">
            <label className="text-caption font-bold text-foreground">{i18n.t('support.priority')}</label>
            <div className="w-[180px]">
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-10 rounded-xl bg-background border border-border/10 hover:border-border/20 spring-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{i18n.t('support.priority.low')}</SelectItem>
                  <SelectItem value="medium">{i18n.t('support.priority.medium')}</SelectItem>
                  <SelectItem value="high">{i18n.t('support.priority.high')}</SelectItem>
                  <SelectItem value="critical">{i18n.t('support.priority.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

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

        {/* Submission Date (auto) */}
        <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border/5 px-3.5 py-2.5 w-fit">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {i18n.t('support.form.submission_date')}{' '}
            <span className="font-bold text-foreground">{new Date().toLocaleDateString(i18n.lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {i18n.t('support.form.diagnostics_notice')}
        </p>

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
  )
}
