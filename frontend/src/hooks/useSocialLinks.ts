import { useEffect, useState } from 'react'
import { fetchSocialLinks, type SocialLinks } from '../api'

let request: Promise<SocialLinks | null> | null = null

/** Dhanvia's social links from Admin → Social media, fetched once per page load. */
export function useSocialLinks(): SocialLinks | null {
  const [links, setLinks] = useState<SocialLinks | null>(null)

  useEffect(() => {
    let active = true
    request ??= fetchSocialLinks().catch(() => null)
    void request.then((result) => { if (active) setLinks(result) })
    return () => { active = false }
  }, [])

  return links
}
