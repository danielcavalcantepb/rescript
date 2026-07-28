import { createFileRoute } from '@tanstack/react-router'
import { ExecutiveDashboardPage } from '#/modules/command-center/ui/pages/executive-dashboard-page'

export const Route = createFileRoute('/_app/app')({
  component: ExecutiveDashboardPage,
})
