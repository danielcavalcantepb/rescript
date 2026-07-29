/**
 * Customer repositories are loaded only from `index.server.ts` by TanStack
 * server functions. The React `server-only` sentinel is intentionally not
 * used here: TanStack executes server functions through a client-component
 * boundary in the production bundle, where that sentinel throws before the
 * command can reach Supabase.
 */
export {}
