import { createFileRoute } from '@tanstack/react-router'
import { SubscriptionIntentPage } from '#/modules/acquisition/ui/subscription-intent-page'

export const Route = createFileRoute('/onboarding/plano')({ component: SubscriptionIntentPage })
