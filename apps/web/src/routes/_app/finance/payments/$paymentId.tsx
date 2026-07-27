import { createFileRoute } from '@tanstack/react-router'
import { PaymentDetailPage } from '#/modules/payments/ui/pages/payment-detail-page'
export const Route=createFileRoute('/_app/finance/payments/$paymentId')({component:RoutePage})
function RoutePage(){return <PaymentDetailPage paymentId={Route.useParams().paymentId}/>}
