import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { marketingHead } from '../seo'
import { MarketingFaq, MarketingNavbar, PricingSection } from './marketing-components'
import { MarketingHomePage } from './marketing-pages'
import { RescripetMarketingPage } from './rescripet-landing'

describe('Marketing website', () => {
  it('renders the public Rescript landing with the two supported entry paths', () => {
    render(<MarketingHomePage />)
    expect(screen.getByRole('heading', { name: /Sob controle/i })).toBeTruthy()
    const onboardingLinks = screen.getAllByRole('link', { name: 'Quero ser Rescript' })
    expect(onboardingLinks.length).toBeGreaterThanOrEqual(3)
    expect(onboardingLinks.every((link) => link.getAttribute('href') === '/onboarding')).toBe(true)
    expect(
      screen
        .getAllByRole('link', { name: 'Entrar' })
        .every((link) => link.getAttribute('href') === '/login'),
    ).toBe(true)
    expect(screen.getByText(/Gest/)).toBeTruthy()
    expect(screen.getByText(/Estoque inteligente/i)).toBeTruthy()
    expect(screen.getAllByText(/Benef/).length).toBeGreaterThan(0)
  })

  it('keeps the responsive menu keyboard-addressable', () => {
    render(<MarketingNavbar />)
    const button = screen.getByRole('button', { name: /abrir menu/i })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText('Entrar').length).toBeGreaterThanOrEqual(1)
  })

  it('keeps the same entry paths in the landing mobile drawer', () => {
    render(<RescripetMarketingPage />)
    const button = screen.getByRole('button', { name: /abrir menu/i })
    fireEvent.click(button)
    expect(screen.getAllByRole('link', { name: 'Entrar' }).some((link) => link.getAttribute('href') === '/login')).toBe(true)
    expect(screen.getAllByRole('link', { name: 'Quero ser Rescript' }).some((link) => link.getAttribute('href') === '/onboarding')).toBe(true)
  })

  it('renders FAQ as native accordion content', () => {
    render(<MarketingFaq />)
    expect(screen.getByText('A Rescript é apenas um ERP?')).toBeTruthy()
  })

  it('keeps pricing cards linked to checkout', () => {
    render(<PricingSection />)
    expect(screen.getAllByRole('link', { name: /Começar com/i })).toHaveLength(4)
  })

  it('generates technical SEO metadata for public routes', () => {
    const head = marketingHead({ title: 'Recursos', description: 'Descrição institucional', path: '/features' })
    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://rescript.com.br/features' }])
    expect(head.meta).toContainEqual({ name: 'description', content: 'Descrição institucional' })
  })

  it('exposes robots and sitemap', () => {
    const publicDir = resolve(process.cwd(), 'public')
    expect(readFileSync(resolve(publicDir, 'robots.txt'), 'utf8')).toContain('Sitemap:')
    expect(readFileSync(resolve(publicDir, 'sitemap.xml'), 'utf8')).toContain('<loc>https://rescript.com.br/</loc>')
  })
})
