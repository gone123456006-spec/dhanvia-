import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { serviceCategoryPages } from './frontend/src/constants/serviceCategoryPages.js'

const productionOrigin = (process.env.VITE_SITE_URL || 'https://dhanvia-frontend.vercel.app').replace(/\/+$/, '')

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

function setDocumentMetadata(html: string, title: string, description: string, path: string, structuredData: unknown) {
  const url = `${productionOrigin}${path}`
  return html
    .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`)
    .replace('</head>', `<script id="dhanvia-structured-data" type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>\n  </head>`)
}

function renderStaticCategory(page: (typeof serviceCategoryPages)[number]) {
  const eligibilityAnswer = page.eligibility.slice(0, 3).join(' ') || 'Eligibility depends on the selected service, applicant, business activity, and current authority rules.'
  const documentsAnswer = page.documents.slice(0, 3).join(' ') || 'Common documents depend on the applicant and service. Review the current checklist before applying.'
  const faqs = [
    { question: `What does ${page.category} cover?`, answer: page.overview },
    { question: `Who may be eligible for ${page.category}?`, answer: eligibilityAnswer },
    { question: `Which documents are commonly needed for ${page.category}?`, answer: documentsAnswer },
    { question: `What should I check before applying for ${page.category}?`, answer: `${eligibilityAnswer} The exact checklist depends on the applicant, activity, location, and current authority instructions.` },
    { question: 'Does this service include other registrations or filings?', answer: 'Not automatically. Related registrations, renewals, tax filings, permissions, or post-approval steps may be separate. Confirm the required scope for your activity and jurisdiction before applying.' },
  ]
  const textList = (items: string[]) => items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p>Requirements depend on the selected service and the applicant’s circumstances. Confirm current rules with the relevant authority.</p>'
  const faqMarkup = faqs.map(({ question, answer }) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('')
  return `<div class="site-shell"><header class="site-header"><div class="header-inner"><a class="brand" href="/">Dhanvia</a><a href="/services/">All service categories</a></div></header><main class="service-directory"><nav class="registration-detail-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">›</span><a href="/services/">Services</a><span aria-hidden="true">›</span><span>${escapeHtml(page.category)}</span></nav><header class="service-directory-intro"><p class="service-directory-eyebrow">${escapeHtml(page.group)}</p><h1>${escapeHtml(page.category)} Services in India</h1><p>${escapeHtml(page.overview)}</p></header><article class="service-directory-group"><h2>How ${escapeHtml(page.category)} works</h2><p>${escapeHtml(page.structure || page.description)}</p><h2>Eligibility and requirements</h2>${textList(page.eligibility)}<h2>Commonly requested documents</h2>${textList(page.documents)}<h2>Services in this category</h2><ul class="service-directory-services">${page.services.map((service) => `<li>${escapeHtml(service)}</li>`).join('')}</ul><p>Requirements can change and may vary by state, entity type, and activity. Verify current instructions with the relevant authority before filing.</p><section class="registration-detail-faq"><div class="registration-detail-faq-inner"><h2>Frequently Asked Questions</h2><div class="registration-detail-faq-list">${faqMarkup}</div></div></section></article></main></div>`
}

function seoFilesPlugin(): Plugin {
  return {
    name: 'dhanvia-seo-files',
    apply: 'build',
    async closeBundle() {
      const outputDirectory = resolve(process.cwd(), 'frontend/dist')
      const indexHtml = await readFile(resolve(outputDirectory, 'index.html'), 'utf8')
      async function writeOutput(fileName: string, contents: string) {
        const filePath = resolve(outputDirectory, fileName)
        await mkdir(dirname(filePath), { recursive: true })
        await writeFile(filePath, contents)
      }
      const pages = [
        { path: '/', priority: '1.0', changeFrequency: 'weekly' },
        { path: '/services', priority: '0.9', changeFrequency: 'weekly' },
        { path: '/contact', priority: '0.5', changeFrequency: 'monthly' },
        ...serviceCategoryPages.map(({ path }) => ({ path, priority: '0.7', changeFrequency: 'monthly' })),
      ]
      const lastModified = new Date().toISOString().slice(0, 10)
      const entries = pages.map(({ path, priority, changeFrequency }) => `  <url>\n    <loc>${productionOrigin}${path}</loc>\n    <lastmod>${lastModified}</lastmod>\n    <changefreq>${changeFrequency}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n')
      await writeOutput('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`)
      await writeOutput('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${productionOrigin}/sitemap.xml\n`)

      const directoryTitle = 'Business Registration, Compliance, IPR & Tax Services | Dhanvia'
      const directoryDescription = 'Browse Dhanvia guides for company registration, compliance, intellectual property, and taxation services in India. Compare categories, eligibility, documents, and next steps.'
      const directoryItems = serviceCategoryPages.map((page) => `<li><a href="${page.path}">${escapeHtml(page.group)}: ${escapeHtml(page.category)}</a></li>`).join('')
      const directoryStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Dhanvia service categories',
        itemListElement: serviceCategoryPages.map((page, index) => ({
          '@type': 'ListItem', position: index + 1, name: `${page.group}: ${page.category}`, url: `${productionOrigin}${page.path}`,
        })),
      }
      const directoryBody = `<div class="site-shell"><header class="site-header"><div class="header-inner"><a class="brand" href="/">Dhanvia</a><a href="/services/">All services</a></div></header><main class="service-directory"><header class="service-directory-intro"><p class="service-directory-eyebrow">Dhanvia service directory</p><h1>Business Registration and Services in India</h1><p>${escapeHtml(directoryDescription)}</p></header><section class="service-directory-group"><h2>All service categories</h2><ul class="service-directory-static-list">${directoryItems}</ul></section></main></div>`
      const directoryHtml = setDocumentMetadata(indexHtml, directoryTitle, directoryDescription, '/services/', directoryStructuredData)
        .replace('<div id="root"></div>', `<div id="root">${directoryBody}</div>`)
      await writeOutput('services/index.html', directoryHtml)

      for (const page of serviceCategoryPages) {
        const title = `${page.category} Services in India | Dhanvia`
        const structuredData = {
          '@context': 'https://schema.org',
          '@graph': [
            { '@type': 'Organization', '@id': `${productionOrigin}/#organization`, name: 'Dhanvia', url: `${productionOrigin}/` },
            { '@type': 'WebPage', name: title, description: page.description, url: `${productionOrigin}${page.path}`, about: page.category, inLanguage: 'en-IN' },
            { '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${productionOrigin}/` },
              { '@type': 'ListItem', position: 2, name: 'Services', item: `${productionOrigin}/services/` },
              { '@type': 'ListItem', position: 3, name: page.category, item: `${productionOrigin}${page.path}` },
            ] },
            { '@type': 'ItemList', name: `${page.category} services`, itemListElement: page.services.map((name, index) => ({ '@type': 'ListItem', position: index + 1, name })) },
            { '@type': 'FAQPage', mainEntity: [
              { '@type': 'Question', name: `What does ${page.category} cover?`, acceptedAnswer: { '@type': 'Answer', text: page.overview } },
              { '@type': 'Question', name: `Who may be eligible for ${page.category}?`, acceptedAnswer: { '@type': 'Answer', text: page.eligibility.slice(0, 3).join(' ') || 'Eligibility depends on the selected service, applicant, business activity, and current authority rules.' } },
              { '@type': 'Question', name: `Which documents are commonly needed for ${page.category}?`, acceptedAnswer: { '@type': 'Answer', text: page.documents.slice(0, 3).join(' ') || 'Common documents depend on the applicant and service. Review the current checklist before applying.' } },
            ] },
          ],
        }
        const categoryHtml = setDocumentMetadata(indexHtml, title, page.description, page.path, structuredData)
          .replace('<div id="root"></div>', `<div id="root">${renderStaticCategory(page)}</div>`)
        await writeOutput(`${page.path.slice(1)}index.html`, categoryHtml)
      }
    },
  }
}

function siteUrlPlugin(): Plugin {
  return {
    name: 'dhanvia-site-url',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%SITE_URL%', productionOrigin),
    },
  }
}

function adminSpaFallbackPlugin(): Plugin {
  const rewrite = (url = '') => {
    const [path] = url.split('?')
    return path === '/admin' || (path.startsWith('/admin/') && !path.includes('.')) ? '/admin/index.html' : url
  }
  return {
    name: 'dhanvia-admin-spa-fallback',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        request.url = rewrite(request.url)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        request.url = rewrite(request.url)
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  root: 'frontend',
  plugins: [react(), siteUrlPlugin(), seoFilesPlugin(), adminSpaFallbackPlugin()],
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(productionOrigin),
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'frontend/index.html'),
        admin: resolve(process.cwd(), 'frontend/admin/index.html'),
      },
    },
  },
  preview: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
