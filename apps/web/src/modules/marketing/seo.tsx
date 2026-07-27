import { marketingSite } from './content'

type MarketingSeoInput = {
  title: string
  description: string
  path: string
}

export function marketingHead({ title, description, path }: MarketingSeoInput) {
  const canonical = `${marketingSite.domain}${path}`
  const pageTitle =
    title === marketingSite.name ? title : `${title} | ${marketingSite.name}`

  return {
    meta: [
      { title: pageTitle },
      { name: 'description', content: description },
      { name: 'robots', content: 'index,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: marketingSite.name },
      { property: 'og:title', content: pageTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: `${marketingSite.domain}/brand/mark.png` },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: pageTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: `${marketingSite.domain}/brand/mark.png` },
    ],
    links: [{ rel: 'canonical', href: canonical }],
  }
}

export function OrganizationStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: marketingSite.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: marketingSite.domain,
    description: marketingSite.description,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/PreOrder',
      price: '0',
      priceCurrency: 'BRL',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
