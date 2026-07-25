import { QueryClient } from '@tanstack/react-query'

let context: { queryClient: QueryClient } | null = null

export function getContext() {
  if (!context) {
    context = {
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
    }
  }
  return context
}

export default function TanstackQueryProvider() {}
