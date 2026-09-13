import assert from 'node:assert/strict';import {randomUUID,createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import fs from 'node:fs';
const origin='http://localhost:3000',token=randomUUID()+randomUUID(),hash=createHash('sha256').update(token).digest('hex'),prefix='qa-'+randomUUID(),checks=[];let cartCookie='',productId='',postId='',taxonomyId='',originalVacation;
function sql(statement){fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/qa.sql',statement);execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--file','work/qa.sql'],{stdio:'pipe',env:{...process.env,WRANGLER_LOG_PATH:'.wrangler/logs',WRANGLER_SEND_METRICS:'false'}});}
async function request(path,{method='GET',data,admin=false,cart=false,originHeader=origin}={}){const r=await fetch(origin+path,{method,headers:{...(method!=='GET'?{'Content-Type':'application/json',Origin:originHeader}:{}),...(admin?{Cookie:'divan_admin='+token}:cart?{Cookie:cartCookie}:{})},body:data?JSON.stringify(data):undefined});const raw=await r.text();let body;try{body=JSON.parse(raw);}catch{body=raw;}return {status:r.status,body,cookie:r.headers.get('set-cookie')};}
function check(name,fn){fn();checks.push({name,result:'PASS'});}
try{
 sql(`INSERT INTO sessions(hash,role,expires_at) VALUES('${hash}','admin',${Date.now()+900000});`);
 let r=await request('/api/admin/products');check('Unauthenticated catalog administration rejected',()=>assert.equal(r.status,401));
 r=await request('/api/admin/products',{method:'POST',data:{},admin:true,originHeader:'https://untrusted.invalid'});check('Cross-origin write rejected',()=>assert.equal(r.status,403));
 r=await request('/api/admin/products',{method:'POST',data:{},admin:true});check('Malformed product rejected',()=>assert.equal(r.status,400));
 const book={slug:prefix,title:'PRUEBA AUTOMÁTICA — NO ES UN LIBRO A LA VENTA',author:'Autor de prueba',publisher:'Editorial de prueba',description:'Registro temporal para verificar el sistema. Se elimina al terminar.',isbn:'',sku:prefix,price_cents:12345,stock:1,cover:'',category:'Pruebas',tags:'QA',weight:500,length:20,width:15,height:2,published:false,featured:false};
 r=await request('/api/admin/products',{method:'POST',data:book,admin:true});check('Administrator can create draft product',()=>assert.equal(r.status,200));productId=r.body.id;
 r=await request('/api/products?q='+prefix);check('Draft is not listed publicly',()=>assert.equal(r.body.length,0));
 r=await request('/api/admin/products',{method:'POST',data:{...book,id:productId,published:true},admin:true});check('Administrator can publish product locally',()=>assert.equal(r.status,200));
 r=await request('/api/products?autor='+encodeURIComponent(book.author)+'&min=123&max=124&disponible=true');check('Author, price and availability filters work',()=>assert(r.body.some(x=>x.id===productId)));
 r=await request('/api/cart',{method:'POST',data:{productId,quantity:2,price_cents:1},cart:true});check('Cart rejects insufficient stock',()=>assert.equal(r.status,409));
 r=await request('/api/cart',{method:'POST',data:{productId,quantity:1,price_cents:1},cart:true});cartCookie=r.cookie.split(';')[0];check('Cart uses server price, ignoring browser price',()=>assert.equal(r.body[0].price_cents,12345));
 r=await request('/api/cart',{cart:true});check('Cart persists across independent requests',()=>assert.equal(r.body[0].quantity,1));
 r=await request('/api/cart');check('Cart is isolated from other visitors',()=>assert.equal(r.body.length,0));
 r=await request('/api/admin/products',{method:'POST',data:{...book,id:productId,published:false},admin:true});
 r=await request('/api/cart',{method:'POST',data:{productId,quantity:0},cart:true});check('Unavailable product can be removed from cart',()=>assert.equal(r.body.length,0));
 r=await request('/api/admin/posts',{method:'POST',admin:true,data:{slug:prefix,title:'PRUEBA EDITORIAL',excerpt:'Prueba temporal',body:'Contenido de prueba',author:'QA',category:'Pruebas',cover:'',published:false}});postId=r.body.id;check('Blog draft created',()=>assert.equal(r.status,200));
 r=await request('/blog/'+prefix);check('Draft blog article is not public',()=>assert.equal(r.status,404));
 r=await request('/api/admin/taxonomy',{method:'POST',admin:true,data:{kind:'autores',name:prefix,slug:prefix,description:'Autor temporal de prueba'}});taxonomyId=r.body.id;check('Author administration persists records',()=>assert.equal(r.status,200));
 originalVacation=(await request('/api/admin/settings',{admin:true})).body;
 r=await request('/api/admin/settings',{method:'POST',admin:true,data:{enabled:true,returnDate:'2026-12-01',message:prefix,acceptOrders:false}});check('Vacation mode can be enabled',()=>assert.equal(r.status,200));
 for(const path of ['/','/carrito','/checkout']){r=await request(path);check('Vacation notice appears on '+path,()=>assert(r.body.includes(prefix)));}
 await request('/api/admin/settings',{method:'POST',admin:true,data:originalVacation});r=await request('/api/admin/settings',{admin:true});check('Vacation settings restored',()=>assert.deepEqual(r.body,originalVacation));
 for(const path of ['/catalogo','/autores','/novedades','/blog','/nosotros','/cuenta','/carrito','/checkout','/administracion']){r=await request(path);check('Route responds '+path,()=>assert.equal(r.status,200));}
}catch(e){checks.push({name:'Test run',result:'FAIL',error:e.message});process.exitCode=1;}finally{
 if(originalVacation)await request('/api/admin/settings',{method:'POST',admin:true,data:originalVacation}).catch(()=>{});
 const quoted=v=>"'"+v.replaceAll("'","''")+"'";
 sql(`DELETE FROM cart_items WHERE product_id=${quoted(productId)};DELETE FROM products WHERE id=${quoted(productId)};DELETE FROM posts WHERE id=${quoted(postId)};DELETE FROM authors WHERE id=${quoted(taxonomyId)};DELETE FROM sessions WHERE hash='${hash}';DELETE FROM audit WHERE entity IN (${quoted(productId)},${quoted(postId)},${quoted(taxonomyId)});`);
 fs.writeFileSync('work/test-results.json',JSON.stringify({date:new Date().toISOString(),checks},null,2));console.log(checks.map(x=>x.result+' '+x.name).join('\n'));
}
