import {
  complianceServiceCategories,
  iprServiceCategories,
  registrationServiceCategories,
  serviceMegaMenus,
  taxationServiceCategories,
} from './data.js'
import { complianceCategoryGuides } from './complianceGuides.js'
import { iprTaxCategoryGuides } from './iprTaxGuides.js'
import { registrationCategoryGuides } from './registrationCategoryGuides.js'
import { defaultRegistrationGuide, registrationGuides } from './registrationGuides.js'

const categoriesByGroup: Record<string, typeof registrationServiceCategories> = {
  Registrations: registrationServiceCategories,
  Compliance: complianceServiceCategories,
  IPR: iprServiceCategories,
  Taxation: taxationServiceCategories,
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function guideDescription(category: string, services: string[]) {
  const guide = registrationCategoryGuides[category]
    ?? complianceCategoryGuides[category]
    ?? iprTaxCategoryGuides[category]
    ?? registrationGuides[category]
    ?? (category === 'Company Registration' ? defaultRegistrationGuide : undefined)
  const overview = guide?.overview
    ?? `Explore ${category} in India, including ${services.slice(0, 3).join(', ')}. Review eligibility, common documents, and the steps relevant to your business before applying.`
  return overview.length <= 158 ? overview : `${overview.slice(0, 155).replace(/\s+\S*$/, '')}...`
}

export const serviceCategoryPages = serviceMegaMenus.flatMap(({ label }) => {
  const groupSlug = slugify(label)
  return categoriesByGroup[label].map(({ category, services }) => {
    const guide = registrationCategoryGuides[category]
      ?? complianceCategoryGuides[category]
      ?? iprTaxCategoryGuides[category]
      ?? registrationGuides[category]
      ?? (category === 'Company Registration' ? defaultRegistrationGuide : undefined)
    const description = guideDescription(category, services)
    return {
      group: label,
      groupSlug,
      category,
      categorySlug: slugify(category),
      path: `/services/${groupSlug}/${slugify(category)}/`,
      description,
      services,
      overview: guide?.overview ?? description,
      structure: guide?.structure ?? '',
      eligibility: guide?.eligibility ?? [],
      documents: guide?.documents ?? [],
    }
  })
})

export function findServiceCategoryPage(path: string) {
  const normalizedPath = path.endsWith('/') ? path : `${path}/`
  return serviceCategoryPages.find((page) => page.path === normalizedPath)
}

export function getServiceCategoryPath(group: string, category: string) {
  const groupSlug = slugify(group)
  const categoryPage = serviceCategoryPages.find((page) => page.groupSlug === groupSlug && page.category === category)
  return categoryPage?.path ?? '/services'
}
