import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ButtonLoading,
  CardLoading,
  InlineLoading,
  PageLoading,
  Skeleton,
  Spinner,
  TableLoading,
} from '#/platform/loading'

describe('loading system', () => {
  it('renders page loading label', () => {
    render(<PageLoading label="Carregando página" />)
    expect(screen.getByText('Carregando página')).toBeTruthy()
  })

  it('renders button and inline loading', () => {
    render(
      <>
        <ButtonLoading label="Salvando…" />
        <InlineLoading label="Aguarde" />
      </>,
    )
    expect(screen.getByText('Salvando…')).toBeTruthy()
    expect(screen.getByText('Aguarde')).toBeTruthy()
  })

  it('renders skeleton primitives', () => {
    const { container } = render(
      <>
        <Spinner />
        <Skeleton className="h-4 w-10" />
        <CardLoading />
        <TableLoading rows={2} cols={2} />
      </>,
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
