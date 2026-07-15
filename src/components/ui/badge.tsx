import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-0.5 text-xs font-medium leading-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-secondary text-secondary-foreground shadow-sm',
        primary:
          'border-primary-100/50 bg-primary-50 text-primary-700 dark:border-primary/10 dark:bg-primary/10 dark:text-primary-300',
        success:
          'border-success-100/50 bg-success-50 text-success-600 dark:border-success/10 dark:bg-success/10 dark:text-success-100',
        warning:
          'border-warning-100/50 bg-warning-50 text-warning-600 dark:border-warning/10 dark:bg-warning/10 dark:text-warning-100',
        danger:
          'border-destructive-100/50 bg-destructive-50 text-destructive-600 dark:border-destructive/10 dark:bg-destructive/10 dark:text-destructive-100',
        outline: 'text-foreground border-border bg-background/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
