import { useState, type ReactNode } from 'react'
import { Sidebar } from '#/components/layout/Sidebar'
import { Topbar } from '#/components/layout/Topbar'
import { CommandPalette } from '#/platform/commands'

export function AppLayout({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-[var(--color-canvas)]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>
      </div>

      {mobileNav ? (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--color-overlay)]"
            aria-label="Fechar menu"
            onClick={() => setMobileNav(false)}
          />
          <div className="relative h-full w-60 max-w-[85vw]">
            <Sidebar onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenCommand={() => setCommandOpen(true)}
          onOpenMobileNav={() => setMobileNav(true)}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
