import { createFileRoute } from '@tanstack/react-router'
import { AcquisitionOnboardingPage } from '#/modules/acquisition/ui/acquisition-onboarding-page'
export const Route = createFileRoute('/onboarding/perfil')({ component: () => <AcquisitionOnboardingPage forcedStep="perfil" /> })
