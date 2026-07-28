import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { marketingSite } from '../content'
import { marketingHead } from '../seo'
import { MarketingFaq, MarketingNavbar, PricingSection } from './marketing-components'
import { MarketingHomePage } from './marketing-pages'

describe('Marketing website', () => {
  it('renders the public home as a premium operational platform narrative', () => {
    render(<MarketingHomePage />)

    expect(screen.getByRole('heading', { name: /Tenha os n.meros da sua empresa nas m.os\.\s*Venda, controle e cres.a\./i })).toBeTruthy()
    expect(screen.getAllByText('Solicitar demonstração').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Conhecer os planos').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Agendar/i)).toBeNull()
    expect(screen.getAllByText('Solicitar demonstração').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(marketingSite.positioning).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText('Síntese visual da proposta da Rescript')).toBeTruthy()
    expect(screen.getByText('Relação, venda e lucro em uma linha só.')).toBeTruthy()
    expect(screen.queryByLabelText(/Mockup/i)).toBeNull()
    expect(screen.queryByText(/screenshots/i)).toBeNull()
    expect(screen.getByText('Não é sobre preencher telas.')).toBeTruthy()
    expect(screen.getByText('Venda que preserva lucro')).toBeTruthy()
    expect(screen.getByText('O problema não é falta de sistema. É falta de verdade compartilhada.')).toBeTruthy()
    expect(screen.getByText('Grandes pilares. Sem catálogo de funcionalidades.')).toBeTruthy()
    expect(screen.getByText('Histórias reais entram com evidência.')).toBeTruthy()
  })

  it('keeps the responsive menu keyboard-addressable and explicit', () => {
    render(<MarketingNavbar />)

    const button = screen.getByRole('button', { name: /abrir menu/i })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText('Entrar').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Solicitar demonstração').length).toBeGreaterThanOrEqual(1)
  })

  it('renders FAQ as native accordion content', () => {
    render(<MarketingFaq />)

    expect(screen.getByText('A Rescript é apenas um ERP?')).toBeTruthy()
    expect(screen.getByText(/plataforma de operação comercial/i)).toBeTruthy()
  })

  it('links pricing cards to checkout', () => {
    render(<PricingSection />)

    expect(screen.getByRole('heading', { name: 'Escolha o tamanho do primeiro passo.' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /Começar com/i })).toHaveLength(4)
  })

  it('generates technical SEO metadata for public routes', () => {
    const head = marketingHead({
      title: 'Recursos',
      description: 'Descrição institucional',
      path: '/features',
    })

    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://rescript.com.br/features' }])
    expect(head.meta).toContainEqual({ name: 'description', content: 'Descrição institucional' })
    expect(head.meta).toContainEqual({ property: 'og:url', content: 'https://rescript.com.br/features' })
    expect(head.meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' })
  })

  it('exposes robots and sitemap for discoverability', () => {
    const publicDir = resolve(process.cwd(), 'public')
    const robots = readFileSync(resolve(publicDir, 'robots.txt'), 'utf8')
    const sitemap = readFileSync(resolve(publicDir, 'sitemap.xml'), 'utf8')

    expect(robots).toContain('Sitemap: https://rescript.com.br/sitemap.xml')
    expect(sitemap).toContain('<loc>https://rescript.com.br/</loc>')
    expect(sitemap).toContain('<loc>https://rescript.com.br/modules</loc>')
  })
})
