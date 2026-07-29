/**
 * Inventory repository adapters are loaded only from `.server` entry points
 * inside TanStack Start server-function handlers. Importing the `server-only`
 * package here makes Vite evaluate its client guard while it builds the RPC
 * client stub, which prevents inventory forms from rendering at all.
 *
 * The `.server` module boundary remains the runtime confinement mechanism;
 * this marker intentionally stays dependency-free so client RPC stubs can be
 * generated safely.
 */
export {}
