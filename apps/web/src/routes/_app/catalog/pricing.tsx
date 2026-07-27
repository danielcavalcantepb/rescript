import { createFileRoute } from '@tanstack/react-router'
import { PricingWorkspacePage } from '#/modules/pricing/ui/pricing-workspace-page'

export const Route = createFileRoute('/_app/catalog/pricing')({
  component: PricingWorkspacePage,
})
