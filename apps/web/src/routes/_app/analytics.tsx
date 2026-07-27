import { createFileRoute } from '@tanstack/react-router'
import { AnalyticsPage } from '#/modules/analytics'

export const Route = createFileRoute('/_app/analytics')({
  component: AnalyticsPage,
})
