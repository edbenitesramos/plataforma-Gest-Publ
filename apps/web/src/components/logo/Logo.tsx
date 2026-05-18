'use client'

interface LogoProps {
  variant?: 'full' | 'icon' | 'dark' | string
  className?: string
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  const isDark = variant === 'dark'

  if (variant === 'icon') {
    return (
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" fill="none" className={className || 'h-8 w-8'}>
        <g transform="translate(8, 10)">
          <rect x="0" y="0" width="16" height="4" rx="1" fill="#0EA5E9"/>
          <rect x="0" y="8" width="12" height="4" rx="1" fill="#0EA5E9"/>
          <rect x="0" y="16" width="16" height="4" rx="1" fill="#0EA5E9"/>
          <rect x="0" y="24" width="9" height="4" rx="1" fill="#0EA5E9"/>
          <rect x="0" y="32" width="16" height="4" rx="1" fill="#0EA5E9"/>
          <rect x="22" y="0" width="4" height="36" rx="1" fill={isDark ? '#fff' : '#1B2A4A'}/>
          <path d="M26 2 Q38 2 38 10 Q38 18 26 18" stroke={isDark ? '#fff' : '#1B2A4A'} strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M26 18 Q40 18 40 27 Q40 36 26 36" stroke={isDark ? '#fff' : '#1B2A4A'} strokeWidth="4" fill="none" strokeLinecap="round"/>
        </g>
      </svg>
    )
  }

  const textColor = isDark ? '#FFFFFF' : '#1B2A4A'
  const subtextColor = isDark ? '#CBD5E0' : '#2D3748'

  return (
    <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" fill="none" className={className || 'h-10'}>
      <g transform="translate(8, 10)">
        <rect x="0" y="0" width="16" height="4" rx="1" fill="#0EA5E9"/>
        <rect x="0" y="8" width="12" height="4" rx="1" fill="#0EA5E9"/>
        <rect x="0" y="16" width="16" height="4" rx="1" fill="#0EA5E9"/>
        <rect x="0" y="24" width="9" height="4" rx="1" fill="#0EA5E9"/>
        <rect x="0" y="32" width="16" height="4" rx="1" fill="#0EA5E9"/>
        <rect x="22" y="0" width="4" height="36" rx="1" fill={textColor}/>
        <path d="M26 2 Q38 2 38 10 Q38 18 26 18" stroke={textColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M26 18 Q40 18 40 27 Q40 36 26 36" stroke={textColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <rect x="46" y="0" width="4" height="36" rx="1" fill={textColor}/>
        <path d="M50 2 Q62 2 62 10 Q62 18 50 18" stroke={textColor} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <line x1="51" y1="18" x2="63" y2="34" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round"/>
        <polygon points="63,34 56,32 61,27" fill="#0EA5E9"/>
        <circle cx="19" cy="18" r="3" fill="#0EA5E9" opacity="0.6"/>
        <circle cx="19" cy="18" r="1.5" fill="#0EA5E9"/>
      </g>
      <text x="85" y="28" fontFamily="Inter, Arial, sans-serif" fontWeight="700" fontSize="16" fill={textColor} letterSpacing="0.5">EBR</text>
      <text x="85" y="44" fontFamily="Inter, Arial, sans-serif" fontWeight="400" fontSize="10" fill={subtextColor} letterSpacing="1.5">CONSULTORIA</text>
    </svg>
  )
}
