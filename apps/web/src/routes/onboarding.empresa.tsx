import { createFileRoute } from '@tanstack/react-router'
import { BusinessIdentityOnboardingPage } from '#/modules/acquisition/ui/business-identity-onboarding-page'

export const Route = createFileRoute('/onboarding/empresa')({ component: BusinessIdentityOnboardingPage })
