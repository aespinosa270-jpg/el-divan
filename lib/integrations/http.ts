export class IntegrationError extends Error {
 constructor(public provider:string,public status:number,public code:string,public retryAfterSeconds=0){super(`${provider}: ${code}`);}
}
export async function providerJson<T>(provider:string,response:Response):Promise<T>{
 if(!response.ok){let code='request_failed';try{const b=await response.json() as {code?:string};if(typeof b.code==='string'&&/^[a-z0-9_]{1,80}$/i.test(b.code))code=b.code;}catch{}throw new IntegrationError(provider,response.status,code,Math.max(0,Math.min(3600,Number(response.headers.get('retry-after'))||0)));}
 try{return await response.json() as T;}catch{throw new IntegrationError(provider,502,'invalid_response');}
}
export async function providerFetch(provider:string,url:string,options:RequestInit,transport:typeof fetch=fetch){try{return await transport(url,{...options,redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new IntegrationError(provider,504,'response_unknown');}}
