import {IntegrationError,providerFetch,providerJson} from './http';
export type FiscalCustomer={legal_name:string;tax_id:string;tax_system:string;address:{zip:string;country:'MEX'}};
export type FiscalProduct={description:string;product_key:string;unit_key:string;price:number;tax_included:boolean;taxability:string;taxes:Array<{type:string;rate?:number;factor?:string;withholding?:boolean}>};
export type InvoicePayload={customer:FiscalCustomer;items:Array<{quantity:number;product:FiscalProduct}>;payment_form:string;payment_method:'PUE';use:string;currency:'MXN';type:'I';external_id:string;idempotency_key:string};
export type FacturapiInvoice={id:string;status:string;livemode:boolean;total:number;uuid?:string|null};
export class FacturapiClient {
 constructor(private key:string,private liveApproved=false,private transport:typeof fetch=fetch){if(!/^sk_(test|live)_/.test(key))throw new IntegrationError('Facturapi',503,'credentials_missing');if(key.startsWith('sk_live_')&&!liveApproved)throw new IntegrationError('Facturapi',403,'live_not_approved');}
 private async request(path:string,method='GET',body?:unknown){return providerFetch('Facturapi','https://www.facturapi.io/v2'+path,{method,headers:{Authorization:'Bearer '+this.key,'Content-Type':'application/json','Accept-Language':'es'},body:body?JSON.stringify(body):undefined},this.transport);}
 async createInvoice(payload:InvoicePayload){if(!payload.idempotency_key||payload.items.length===0)throw new IntegrationError('Facturapi',400,'invalid_invoice');const result=await providerJson<FacturapiInvoice>('Facturapi',await this.request('/invoices','POST',payload));return this.validate(result);}
 async getInvoice(id:string){return this.validate(await providerJson<FacturapiInvoice>('Facturapi',await this.request('/invoices/'+encodeURIComponent(id))));}
 private validate(result:FacturapiInvoice){if(!result?.id||typeof result.status!=='string'||result.livemode!==this.key.startsWith('sk_live_'))throw new IntegrationError('Facturapi',502,'unexpected_invoice');return result;}
 async download(id:string,format:'xml'|'pdf'){const r=await this.request('/invoices/'+encodeURIComponent(id)+'/'+format);if(!r.ok)await providerJson('Facturapi',r);return r;}
}
