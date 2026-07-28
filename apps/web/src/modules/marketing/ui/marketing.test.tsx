import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { marketingHead } from '../seo'
import { MarketingFaq, MarketingNavbar, PricingSection } from './marketing-components'
import { MarketingHomePage } from './marketing-pages'

describe('Marketing website', () => {
  it('renders the reconstructed premium Rescript landing', () => {
    render(<MarketingHomePage />)
    expect(screen.getByRole('heading', { name: /Sob controle/i })).toBeTruthy()
    expect(screen.getAllByText('Solicitar demonstração').length).toBeGreaterThan(1)
    expect(screen.getByText('Explorar a plataforma')).toBeTruthy()
    expect(screen.getByText('Gestão para operações que querem crescer')).toBeTruthy()
    expect(screen.getByText('Estoque inteligente')).toBeTruthy()
    expect(screen.getByText('Benefícios da Rescript')).toBeTruthy()
  })

  it('keeps the responsive menu keyboard-addressable', () => {
    render(<MarketingNavbar />)
    const button = screen.getByRole('button', { name: /abrir menu/i })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText('Entrar').length).toBeGreaterThanOrEqual(1)
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
