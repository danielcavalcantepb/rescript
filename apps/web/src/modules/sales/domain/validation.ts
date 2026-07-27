import type{SalesItemInput}from'./types'
const decimal=(v:string)=>/^\d+(?:\.\d{1,6})?$/.test(v)&&Number(v)>=0
export function validateSalesItems(items:SalesItemInput[]){if(!items.length)throw Error('items_required');for(const i of items){if(!i.variantId||!decimal(i.quantity)||Number(i.quantity)<=0||!decimal(i.unitPrice)||!decimal(i.discount??'0')||Number(i.discount??0)>Number(i.quantity)*Number(i.unitPrice))throw Error('invalid_item')}}
