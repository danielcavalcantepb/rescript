import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EntityPicker, type EntityProvider } from './entity-picker'

type Item = { id: string; name: string; detail?: string }

const provider: EntityProvider<Item> = {
  id: 'test',
  singularLabel: 'cliente',
  getId: (item) => item.id,
  getLabel: (item) => item.name,
  getDescription: (item) => item.detail ?? null,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('EntityPicker', () => {
  it('debounces incremental search', () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    render(
      <EntityPicker
        provider={provider}
        value={null}
        items={[]}
        onSearch={onSearch}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Ana' } })
    expect(onSearch).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(300))
    expect(onSearch).toHaveBeenCalledWith('Ana')
  })

  it('selects an existing entity without navigation', () => {
    const onSelect = vi.fn()
    render(
      <EntityPicker
        provider={provider}
        value={null}
        items={[{ id: 'customer-1', name: 'Ana Clara', detail: '123' }]}
        onSearch={vi.fn()}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Ana' },
    })
    fireEvent.click(screen.getByRole('option', { name: /Ana Clara/ }))

    expect(onSelect).toHaveBeenCalledWith({
      id: 'customer-1',
      name: 'Ana Clara',
      detail: '123',
    })
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(
      'Ana Clara',
    )
  })

  it('supports keyboard navigation and selection', () => {
    const onSelect = vi.fn()
    render(
      <EntityPicker
        provider={provider}
        value={null}
        items={[
          { id: 'customer-1', name: 'Ana Clara' },
          { id: 'customer-2', name: 'Bruno Lima' },
        ]}
        onSearch={vi.fn()}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Cliente' } })
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input.getAttribute('aria-activedescendant')).toContain('option-1')

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith({
      id: 'customer-2',
      name: 'Bruno Lima',
    })
    expect((input as HTMLInputElement).value).toBe('Bruno Lima')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('offers inline creation only when permitted', () => {
    const onCreate = vi.fn()
    const { rerender } = render(
      <EntityPicker
        provider={provider}
        value={null}
        items={[]}
        canCreate={false}
        onSearch={vi.fn()}
        onSelect={vi.fn()}
        onCreate={onCreate}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Cliente novo' },
    })
    expect(screen.queryByRole('button', { name: 'Criar cliente' })).toBeNull()

    rerender(
      <EntityPicker
        provider={provider}
        value={null}
        items={[]}
        canCreate
        onSearch={vi.fn()}
        onSelect={vi.fn()}
        onCreate={onCreate}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }))
    expect(onCreate).toHaveBeenCalledWith('Cliente novo')
  })

  it('supports paginated results', () => {
    const onLoadMore = vi.fn()
    render(
      <EntityPicker
        provider={provider}
        value={null}
        items={[{ id: '1', name: 'Cliente um' }]}
        hasNextPage
        onSearch={vi.fn()}
        onLoadMore={onLoadMore}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Cliente' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    expect(onLoadMore).toHaveBeenCalledOnce()
  })
})
