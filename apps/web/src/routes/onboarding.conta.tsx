import { createFileRoute } from '@tanstack/react-router'
import { AcquisitionOnboardingPage } from '#/modules/acquisition/ui/acquisition-onboarding-page'
export const Route = createFileRoute('/onboarding/conta')({ component: () => <AcquisitionOnboardingPage forcedStep="conta" /> })
