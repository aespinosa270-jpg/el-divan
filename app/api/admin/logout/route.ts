import {endpoint,sameOrigin} from '@/lib/validation';import {cookie,hash,sessionCookie} from '@/lib/security';import {run} from '@/lib/db';
export async function POST(r:Request){return endpoint(async()=>{sameOrigin(r);await run('DELETE FROM sessions WHERE hash=?',await hash(cookie(r,'divan_admin')));return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(r,'divan_admin','',0)}});});}
