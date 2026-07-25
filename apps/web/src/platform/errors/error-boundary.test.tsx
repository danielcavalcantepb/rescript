import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GlobalErrorBoundary } from '#/platform/errors/error-boundary'

vi.mock('#/platform/observability/noop', () => ({
  errorReporter: { capture: vi.fn() },
}))

function Boom(): never {
  throw new Error('boom')
}

describe('GlobalErrorBoundary', () => {
  it('captures render errors and shows recovery UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <GlobalErrorBoundary>
        <Boom />
      </GlobalErrorBoundary>,
    )
    expect(screen.getByText('Algo deu errado')).toBeTruthy()
    expect(screen.getByText('boom')).toBeTruthy()
    spy.mockRestore()
  })
})
