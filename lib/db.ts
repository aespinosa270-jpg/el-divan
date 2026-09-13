import { env } from 'cloudflare:workers';
export function database(): D1Database { const db=(env as unknown as {DB?:D1Database}).DB; if(!db) throw new Error('Database unavailable'); return db; }
export function secret(name:string):string { return (env as unknown as Record<string,string>)[name] || ''; }
export const now=()=>new Date().toISOString();
export async function all<T=Record<string,unknown>>(sql:string,...values:unknown[]){ const result=await database().prepare(sql).bind(...values).all<T>(); return result.results; }
export async function one<T=Record<string,unknown>>(sql:string,...values:unknown[]){return database().prepare(sql).bind(...values).first<T>();}
export async function run(sql:string,...values:unknown[]){return database().prepare(sql).bind(...values).run();}
export async function getSetting<T>(key:string,fallback:T):Promise<T>{const row=await one<{value:string}>('SELECT value FROM settings WHERE id = ?',key);return row?JSON.parse(row.value):fallback;}
export const vacationDefault={enabled:false,returnDate:'',message:'',acceptOrders:false};
export async function vacation(){return getSetting('vacation',vacationDefault);}
