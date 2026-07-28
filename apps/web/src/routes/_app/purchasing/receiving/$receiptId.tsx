import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/purchasing/receiving/$receiptId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/procurement/receiving/$receiptId',
      params: { receiptId: params.receiptId },
    })
  },
})
