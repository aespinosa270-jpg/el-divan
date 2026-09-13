import {Miniflare} from 'miniflare';import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('lib/commerce.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {commerce}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-05-15',d1Databases:['DB'],cf:false});
const results=[];const ok=(name,fn)=>{fn();results.push({name,result:'PASS'});};
try{const db=await mf.getD1Database('DB');for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()){for(const sql of fs.readFileSync('drizzle/'+file,'utf8').split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();}
 await db.prepare("INSERT INTO products(id,slug,title,author,publisher,description,price_cents,stock,category,weight,length,width,height,published,created_at,updated_at) VALUES('p','qa','QA','QA','QA','QA',10000,1,'QA',500,20,15,2,1,'2026-09-12','2026-09-12')").run();
 for(const id of ['a','b']){await db.prepare('INSERT INTO carts(id,created_at) VALUES(?,?)').bind(id,'2026-09-12').run();await db.prepare('INSERT INTO cart_items(id,cart_id,product_id,quantity) VALUES(?,?,?,1)').bind(id,id,'p').run();}
 const svc=commerce(db),input=id=>({cartId:id,requestKey:'key-'+id,email:'qa@example.invalid',address:{name:'QA',street:'Prueba',city:'Prueba',state:'Prueba',postalCode:'01000'},quote:{cartId:id,amountCents:1000,expiresAt:Date.now()+60000}});
 const settled=await Promise.allSettled([svc.reserve(input('a')),svc.reserve(input('b'))]);ok('Exactly one concurrent buyer reserves last unit',()=>assert.equal(settled.filter(s=>s.status==='fulfilled').length,1));
 const winner=settled.find(s=>s.status==='fulfilled').value;let stock=await db.prepare("SELECT stock FROM products WHERE id='p'").first();ok('Inventory never falls below zero',()=>assert.equal(stock.stock,0));
 const retry=await svc.reserve(input(winner.cart_id));ok('Duplicate reservation returns same order',()=>assert.equal(retry.id,winner.id));
 await svc.cancel(winner.id);await svc.cancel(winner.id);stock=await db.prepare("SELECT stock FROM products WHERE id='p'").first();ok('Repeated cancellation restores stock once',()=>assert.equal(stock.stock,1));
 const nextInput=input(winner.cart_id==='a'?'b':'a'),next=await svc.reserve(nextInput);
 const event={orderId:next.id,provider:'test',eventId:'evt-1',paymentId:'pay-1',amountCents:11000,currency:'MXN',paymentForm:'03'};
 await assert.rejects(()=>svc.confirmVerifiedPayment({...event,amountCents:1}));ok('Wrong payment total cannot confirm order',()=>{});
 await svc.confirmVerifiedPayment(event);const duplicate=await svc.confirmVerifiedPayment(event);ok('Duplicate verified payment is idempotent',()=>assert.equal(duplicate.duplicate,true));
 await svc.cancel(next.id);stock=await db.prepare("SELECT stock FROM products WHERE id='p'").first();ok('Paid order cannot restore sold stock through cancellation',()=>assert.equal(stock.stock,0));
 const order=await svc.order(next.id);ok('Payment confirmed using server total',()=>{assert.equal(order.status,'paid');assert.equal(order.total,11000);});
}catch(e){results.push({name:'Commerce test run',result:'FAIL',error:e.message});process.exitCode=1;}finally{await mf.dispose();fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/commerce-test-results.json',JSON.stringify({date:new Date().toISOString(),checks:results},null,2));console.log(results.map(x=>x.result+' '+x.name+(x.error?': '+x.error:'')).join('\n'));}
