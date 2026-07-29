/**
 * Catalog repositories are dynamically imported only by TanStack Start
 * Server Functions. The `server-only` package throws when that server
 * handler is resolved through the client-component graph, preventing every
 * Catalog RPC (including categories and brands) from running at runtime.
 *
 * Server confinement remains enforced by the `.server` entry points and the
 * dynamic import boundary in `catalog-api.ts`.
 */
export {}
