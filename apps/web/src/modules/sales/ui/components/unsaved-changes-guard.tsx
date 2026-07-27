import { useEffect } from 'react'
import { useBlocker } from '@tanstack/react-router'
import { dialogs } from '#/platform/dialogs'

export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker({
    shouldBlockFn: () => when,
    enableBeforeUnload: when,
    withResolver: true,
  })

  useEffect(() => {
    if (blocker.status !== 'blocked') return
    let active = true
    void dialogs
      .discard({
        title: 'Sair do pedido?',
        description: 'O pedido possui alterações não salvas.',
      })
      .then((result) => {
        if (!active) return
        if (result.confirmed) blocker.proceed()
        else blocker.reset()
      })
    return () => {
      active = false
    }
  }, [blocker])

  return null
}
