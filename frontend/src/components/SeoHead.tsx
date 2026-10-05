import { useEffect } from 'react'

interface SeoHeadProps {
  title: string
  description: string
  canonicalPath: string
  structuredData: Record<string, unknown>
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export function SeoHead({ title, description, canonicalPath, structuredData }: SeoHeadProps) {
  useEffect(() => {
    const canonicalUrl = `https://www.dhanvia.com${canonicalPath}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', 'index, follow, max-image-preview:large')
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', 'Dhanvia')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:locale', 'en_IN')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl

    let schema = document.head.querySelector<HTMLScriptElement>('#dhanvia-structured-data')
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'dhanvia-structured-data'
      schema.type = 'application/ld+json'
      document.head.append(schema)
    }
    schema.textContent = JSON.stringify(structuredData)
  }, [title, description, canonicalPath, structuredData])

  return null
}
