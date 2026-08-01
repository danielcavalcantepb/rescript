import { createFileRoute } from '@tanstack/react-router'
import { BillingSessionPage } from '#/modules/acquisition/ui/subscription-intent-page'

export const Route = createFileRoute('/onboarding/pagamento')({ component: BillingSessionPage })
