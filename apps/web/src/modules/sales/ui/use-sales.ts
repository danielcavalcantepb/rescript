import{useMutation,useQuery,useQueryClient}from'@tanstack/react-query'
import{queryKeys}from'#/platform/cache/query-keys'
import{useOrganization}from'#/platform/organization/organization-context'
import type{CreateQuotationInput,CreateSalesOrderInput,ListSalesQuery,SalesDocumentType,UpdateQuotationInput,UpdateSalesOrderInput}from'../domain/types'
import{convertQuotationToSalesOrder,createQuotation,createSalesOrder,getSalesDocument,listSalesDocuments,transitionQuotation,transitionSalesOrder,updateQuotation,updateSalesOrder,type SalesRpcResult}from'./sales-api'
const unwrap=<T,>(r:SalesRpcResult<T>)=>{if(!r.ok)throw Error(r.error.message);return r.data};const useOrg=()=>useOrganization().currentOrganization?.id
export function useSalesDocuments(type:SalesDocumentType,query:ListSalesQuery){const org=useOrg();return useQuery({queryKey:queryKeys.sales.list(org??'none',type,query),enabled:Boolean(org),queryFn:async()=>{if(!org)throw Error('missing_org');return unwrap(await listSalesDocuments({data:{organizationId:org,type,query}}))}})}
export function useSalesDocument(type:SalesDocumentType,id:string,options?:{refetchOnWindowFocus?:boolean}){const org=useOrg();return useQuery({queryKey:queryKeys.sales.detail(org??'none',type,id),enabled:Boolean(org&&id),refetchOnWindowFocus:options?.refetchOnWindowFocus,queryFn:async()=>{if(!org)throw Error('missing_org');return unwrap(await getSalesDocument({data:{organizationId:org,type,id}})as SalesRpcResult<import('../domain/types').SalesDocumentDetail>)}})}
function mutation<T>(fn:(org:string,input:T)=>Promise<SalesRpcResult<string>>){const org=useOrg(),qc=useQueryClient();return useMutation({mutationFn:async(input:T)=>{if(!org)throw Error('missing_org');return unwrap(await fn(org,input))},onSuccess:()=>{if(org)void qc.invalidateQueries({queryKey:queryKeys.sales.all(org)})}})}
export const useCreateQuotation=()=>mutation<CreateQuotationInput>((organizationId,input)=>createQuotation({data:{organizationId,input}}))
export const useCreateSalesOrder=()=>mutation<CreateSalesOrderInput>((organizationId,input)=>createSalesOrder({data:{organizationId,input}}))
export const useUpdateQuotation=(id:string)=>mutation<UpdateQuotationInput>((organizationId,input)=>updateQuotation({data:{organizationId,id,input}}))
export const useUpdateSalesOrder=(id:string)=>mutation<UpdateSalesOrderInput>((organizationId,input)=>updateSalesOrder({data:{organizationId,id,input}}))
export const useConvertQuotationToSalesOrder=()=>mutation<string>((organizationId,quotationId)=>convertQuotationToSalesOrder({data:{organizationId,quotationId}}))
export const useTransitionQuotation=()=>mutation<{id:string;to:string;reason?:string|null}>((organizationId,input)=>transitionQuotation({data:{organizationId,...input}}))
export const useTransitionSalesOrder=()=>mutation<{id:string;to:string;reason?:string|null}>((organizationId,input)=>transitionSalesOrder({data:{organizationId,...input}}))
