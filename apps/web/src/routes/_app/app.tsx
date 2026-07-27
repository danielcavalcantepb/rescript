import { createFileRoute } from '@tanstack/react-router'
import { CommandCenterPage } from '#/modules/command-center'

export const Route = createFileRoute('/_app/app')({
  component: CommandCenterPage,
})
