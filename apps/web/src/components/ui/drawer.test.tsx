import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './drawer'

describe('Drawer', () => {
  it('renders an accessible full-width mobile drawer', () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Novo cliente</DrawerTitle>
            <DrawerDescription>Cadastro contextual</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>Formulário</DrawerBody>
        </DrawerContent>
      </Drawer>,
    )

    const drawer = screen.getByRole('dialog', { name: 'Novo cliente' })
    expect(drawer.className).toContain('w-full')
    expect(drawer.className).toContain('sm:w-[min(92vw,560px)]')
    expect(screen.getByText('Cadastro contextual')).toBeTruthy()
  })
})
