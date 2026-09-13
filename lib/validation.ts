export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function text(value:unknown,name:string,max=200,required=true){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new ApiError(400,`Revisa ${name}.`);return value.trim();}
export function integer(value:unknown,name:string,min=0,max=100000000){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)throw new ApiError(400,`Revisa ${name}.`);return value;}
export function positive(value:unknown,name:string){if(typeof value!=='number'||!Number.isFinite(value)||value<=0||value>100000)throw new ApiError(400,`Revisa ${name}.`);return value;}
export function slug(value:unknown){const s=text(value,'la URL',180);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))throw new ApiError(400,'Usa una URL con letras minúsculas, números y guiones.');return s;}
export function imageUrl(value:unknown){const s=text(value,'la portada',1500,false);if(!s)return '';let u:URL;try{u=new URL(s);}catch{throw new ApiError(400,'Usa una URL HTTPS para la portada.');}if(u.protocol!=='https:'||u.username||u.password)throw new ApiError(400,'Usa una URL HTTPS para la portada.');return u.href;}
export async function body(request:Request){
 if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError(415,'Formato no admitido.');
 const max=100000;if(Number(request.headers.get('content-length'))>max)throw new ApiError(413,'Contenido demasiado largo.');
 const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'Faltan datos.');
 const chunks:Uint8Array[]=[];let length=0;while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();throw new ApiError(413,'Contenido demasiado largo.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const b=JSON.parse(new TextDecoder().decode(bytes));if(!b||typeof b!=='object'||Array.isArray(b))throw Error();return b as Record<string,unknown>;}catch{throw new ApiError(400,'Datos no válidos.');}
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw new ApiError(403,'Solicitud no permitida.');}
export async function endpoint(fn:()=>Promise<Response>){try{return await fn();}catch(e){if(e instanceof ApiError)return Response.json({error:e.message},{status:e.status});console.error('Request failed',e instanceof Error?e.name:'UnknownError');return Response.json({error:'No pudimos completar la operación. Intenta nuevamente.'},{status:500});}}
export function money(cents:number){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100);}
