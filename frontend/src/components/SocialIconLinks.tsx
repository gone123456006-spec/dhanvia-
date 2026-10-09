import { socialIcons } from '../constants/socialIcons'
import { useSocialLinks } from '../hooks/useSocialLinks'

interface SocialIconLinksProps {
  /** Limit to these networks; defaults to every network. */
  only?: string[]
}

/**
 * SocialIconLinks
 * Icons for Dhanvia's social pages. Networks with a saved link open it in a new tab;
 * Instagram and YouTube still show without a link so the spot is ready once one is added.
 */
export function SocialIconLinks({ only }: SocialIconLinksProps) {
  const links = useSocialLinks()

  return socialIcons
    .filter(({ key }) => !only || only.includes(key))
    .map(({ key, label, path, alwaysShown }) => {
      const href = links?.[key] ?? ''
      const icon = <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={path} /></svg>
      if (href) {
        return <a className="social-icon-link" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} key={key}>{icon}</a>
      }
      if (!alwaysShown) return null
      return <span className="social-icon-link is-pending" role="img" aria-label={`${label} (link coming soon)`} title={`${label} — coming soon`} key={key}>{icon}</span>
    })
}
