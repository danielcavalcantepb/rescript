import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { GlobalLoading } from '#/components/GlobalLoading'
import { AppSessionProvider } from '#/providers/app-session'
import { AppShellProviders } from '#/providers/app-shell-providers'
import { PageError } from '#/platform/errors'
import appCss from '../styles.css?url'
import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Rescript' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.png', type: 'image/png' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  pendingComponent: GlobalLoading,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-canvas)] px-4 text-center">
      <img
        src="/brand/rescript-wordmark.png"
        alt="Rescript"
        className="h-7 w-auto object-contain opacity-95"
      />
      <p className="text-sm text-[var(--color-muted)]">404</p>
      <h1 className="text-xl font-medium text-[var(--color-ink)]">Página não encontrada</h1>
      <a href="/" className="text-sm text-[var(--color-primary)] hover:underline">
        Voltar ao site
      </a>
    </div>
  )
}

function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)]">
      <PageError
        error={error}
        onRecover={() => {
          window.location.href = '/'
        }}
        onRetry={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}

function RootComponent() {
  return (
    <AppSessionProvider>
      <AppShellProviders>
        <Outlet />
      </AppShellProviders>
    </AppSessionProvider>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Apply saved/system theme before paint to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='rescript.theme';var p=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=p==='dark'||(p!=='light'&&d);var r=document.documentElement;r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light';}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts.geist-sans.css"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts.geist-mono.css"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
