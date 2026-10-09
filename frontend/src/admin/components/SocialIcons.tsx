import { useId } from 'react'

export type SocialNetwork = 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'twitter'

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

function LinkedInIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0a66c2" />
      <path fill="#fff" d="M7.1 9.6h2.5V18H7.1zM8.35 5.6a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9ZM11.2 9.6h2.4v1.15h.04c.33-.63 1.15-1.3 2.37-1.3 2.54 0 3 1.67 3 3.84V18h-2.5v-4.2c0-1-.02-2.29-1.4-2.29-1.4 0-1.6 1.09-1.6 2.22V18h-2.5z" />
    </svg>
  )
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#000" />
      <path fill="#fff" d="M13.2 11.1 17.6 6h-1.05l-3.82 4.43L9.68 6H6.15l4.6 6.7L6.15 18h1.04l4.03-4.68L14.44 18h3.53l-4.77-6.9Zm-1.43 1.65-.47-.67-3.7-5.3h1.6l3 4.29.46.67 3.9 5.58h-1.6l-3.19-4.57Z" />
    </svg>
  )
}

export function SocialIcon({ network, size = 20 }: { network: SocialNetwork; size?: number }) {
  if (network === 'instagram') return <InstagramIcon size={size} />
  if (network === 'facebook') return <FacebookIcon size={size} />
  if (network === 'linkedin') return <LinkedInIcon size={size} />
  if (network === 'twitter') return <XIcon size={size} />
  return <YouTubeIcon size={size} />
}
