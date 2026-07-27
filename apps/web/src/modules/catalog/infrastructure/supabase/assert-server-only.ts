import 'server-only'

/**
 * Side-effect import: bundlers that resolve `server-only` for the client
 * graph throw at build/runtime. Keep this as the first import of every
 * Catalog SQL / repository module that must stay server-side.
 */
export {}
