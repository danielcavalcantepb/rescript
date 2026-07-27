export type ReceivableStatus='draft'|'open'|'partially_paid'|'paid'|'cancelled'|'archived'
export type ReceivableOrigin={type:'manual'|'sales';id:string|null}
export type InstallmentInput={dueDate:string;amount:string}
export type CreateReceivableInput={customerId:string;issueDate:string;dueDate:string;totalAmount:string;currency:string;notes?:string|null;installments:InstallmentInput[];origin?:ReceivableOrigin}
export type ReceivableListItem={id:string;number:string;customerId:string;customerName:string;customerDocument:string|null;status:ReceivableStatus;dueDate:string;totalAmount:string;openAmount:string;paidAmount:string;currency:string}
export type ReceivableDetail=ReceivableListItem&{issueDate:string;notes:string|null;origin:ReceivableOrigin;installments:Array<{id:string;sequence:number;dueDate:string;originalAmount:string;openAmount:string;paidAmount:string;status:string}>;history:Array<{id:string;action:string;reason:string|null;createdAt:string}>}
export type ListReceivablesQuery={q?:string;status?:ReceivableStatus;dueFrom?:string;dueTo?:string;limit?:number}
