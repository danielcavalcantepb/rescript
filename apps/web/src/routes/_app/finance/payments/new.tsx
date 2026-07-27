import { createFileRoute } from '@tanstack/react-router'
import { PaymentCreatePage } from '#/modules/payments/ui/pages/payment-create-page'
export const Route=createFileRoute('/_app/finance/payments/new')({
 validateSearch:(search:Record<string,unknown>)=>({payableId:typeof search.payableId==='string'?search.payableId:undefined}),
 component:NewPaymentRoute,
})
function NewPaymentRoute(){const {payableId}=Route.useSearch();return <PaymentCreatePage initialPayableId={payableId}/>}
