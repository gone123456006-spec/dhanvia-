import { useId } from 'react'

export type SocialNetwork = 'instagram' | 'facebook' | 'youtube'

function InstagramIcon({ size }: { size: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset=".05" stopColor="#fdf497" />
          <stop offset=".45" stopColor="#fd5949" />
          <stop offset=".6" stopColor="#d6249f" />
          <stop offset=".9" stopColor="#285aeb" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill={`url(#${id})`} />
      <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.3" cy="7.7" r="1.05" fill="#fff" />
    </svg>
  )
}

function FacebookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877f2" />
      <path fill="#fff" d="M13.4 24v-8.6h2.9l.45-3.4H13.4V9.85c0-.98.28-1.65 1.68-1.65h1.78V5.17A23.6 23.6 0 0 0 14.27 5c-2.57 0-4.33 1.57-4.33 4.45V12H7.03v3.4h2.91V24z" />
    </svg>
  )
}

function YouTubeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect y="3.5" width="24" height="17" rx="5" fill="#ff0000" />
      <path fill="#fff" d="M9.6 8.4v7.2l6.2-3.6z" />
    </svg>
  )
}

export function SocialIcon({ network, size = 20 }: { network: SocialNetwork; size?: number }) {
  if (network === 'instagram') return <InstagramIcon size={size} />
  if (network === 'facebook') return <FacebookIcon size={size} />
  return <YouTubeIcon size={size} />
}
