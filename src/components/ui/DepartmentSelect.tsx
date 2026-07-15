import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { i18n } from '@/lib/i18n'
import type { Department } from '@/lib/types'

const DEPARTMENT_KEYS: Department[] = [
  'engineering', 'qa', 'it', 'hr', 'finance', 'accounting',
  'marketing', 'sales', 'operations', 'design', 'legal',
  'customer_support', 'product',
]

interface DepartmentSelectProps {
  value: string
  onValueChange: (v: string) => void
  id?: string
  placeholder?: string
  includeEmpty?: boolean
}

export function DepartmentSelect({
  value,
  onValueChange,
  id,
  placeholder,
  includeEmpty = true,
}: DepartmentSelectProps) {
  return (
    <Select aria-label={placeholder ?? i18n.t('profile.department')} value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="h-9 rounded-xl bg-background/50 border-border/40">
        <SelectValue placeholder={placeholder ?? i18n.t('profile.department_placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {includeEmpty && <SelectItem value="">{i18n.t('profile.department_placeholder')}</SelectItem>}
        {DEPARTMENT_KEYS.map((dept) => (
          <SelectItem key={dept} value={dept}>
            {i18n.t(`department.${dept}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
