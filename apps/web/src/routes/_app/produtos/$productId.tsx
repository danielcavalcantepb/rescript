import { createFileRoute, redirect } from '@tanstack/react-router'

/** Compatibility route: preserve old product links without duplicating UI. */
export const Route = createFileRoute('/_app/produtos/$productId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/catalog/products/$productId',
      params: { productId: params.productId },
    })
  },
})
