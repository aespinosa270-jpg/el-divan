import {endpoint,body,sameOrigin,text,ApiError} from '@/lib/validation';
import {checkAdminPassword,limit,hash,sessionCookie} from '@/lib/security';
import {run} from '@/lib/db';
export async function POST(r:Request){return endpoint(async()=>{sameOrigin(r);await limit(r,'admin-login');const b=await body(r);if(!await checkAdminPassword(text(b.password,'la contraseña',300)))throw new ApiError(401,'Acceso no válido.');const token=crypto.randomUUID()+crypto.randomUUID();await run('INSERT INTO sessions(hash,role,expires_at) VALUES (?,?,?)',await hash(token),'admin',Date.now()+28800000);return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(r,'divan_admin',token,28800)}});});}
