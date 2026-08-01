import { createFileRoute, redirect } from '@tanstack/react-router'

/** Keeps the public CTA at `/onboarding` while the actual account form lives
 * in its explicit, resumable `/onboarding/conta` step. */
export const Route = createFileRoute('/onboarding/')({
  beforeLoad: () => {
    throw redirect({ to: '/onboarding/conta' })
  },
})
