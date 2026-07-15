import { cn } from '@/lib/utils'

interface NovaLogoProps {
  className?: string
  showText?: boolean
}

export function NovaLogo({ className, showText = false }: NovaLogoProps) {
  if (showText) {
    return (
      <svg viewBox="0 0 512 512" fill="none" className={cn('h-24 w-24', className)} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="comp-blade-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="comp-blade-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="comp-blade-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="comp-blade-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
        </defs>

        {/* Chromatic Blades Group (centered and scaled) */}
        <g transform="translate(256, 200) scale(0.8) translate(-256, -256)">
          <path d="M 256 64 C 256 160 220 220 160 220 C 220 220 256 220 256 64 Z" fill="url(#comp-blade-top)" />
          <path d="M 448 256 C 352 256 292 220 292 160 C 292 220 292 256 448 256 Z" fill="url(#comp-blade-right)" />
          <path d="M 256 448 C 256 352 292 292 352 292 C 292 292 256 292 256 448 Z" fill="url(#comp-blade-bottom)" />
          <path d="M 64 256 C 160 256 220 292 220 352 C 220 292 220 256 64 256 Z" fill="url(#comp-blade-left)" />
          <path d="M 210 260 L 245 295 L 320 210" stroke="white" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Vector Wordmark "NOVA" at the bottom */}
        <g stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M 133.5 450 L 133.5 390 L 183.5 450 L 183.5 390" />
          <rect x="198.5" y="390" width="50" height="60" rx="15" ry="15" />
          <path d="M 263.5 390 L 288.5 450 L 313.5 390" />
          <path d="M 328.5 450 L 353.5 390 L 378.5 450" />
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 512 512" fill="none" className={cn('h-5.5 w-5.5', className)} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="comp-blade-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="comp-blade-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="comp-blade-bottom" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="comp-blade-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      <path d="M 256 64 C 256 160 220 220 160 220 C 220 220 256 220 256 64 Z" fill="url(#comp-blade-top)" />
      <path d="M 448 256 C 352 256 292 220 292 160 C 292 220 292 256 448 256 Z" fill="url(#comp-blade-right)" />
      <path d="M 256 448 C 256 352 292 292 352 292 C 292 292 256 292 256 448 Z" fill="url(#comp-blade-bottom)" />
      <path d="M 64 256 C 160 256 220 292 220 352 C 220 292 220 256 64 256 Z" fill="url(#comp-blade-left)" />
      <path d="M 210 260 L 245 295 L 320 210" stroke="white" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
