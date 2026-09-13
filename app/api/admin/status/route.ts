import {isAdmin} from '@/lib/security';import {endpoint} from '@/lib/validation';
export async function GET(r:Request){return endpoint(async()=>Response.json({authenticated:await isAdmin(r)},{headers:{'Cache-Control':'no-store'}}));}
