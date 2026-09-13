/** Internal order service. Never expose these functions directly as public API handlers.
 * A payment/shipping adapter must validate its provider response before calling this service.
 * No provider adapters are enabled yet. All amounts are integer MXN cents.
 */
export class CommerceConflict extends Error {}
export type ShippingQuote={cartId:string;amountCents:number;expiresAt:number};
export type OrderInput={cartId:string;requestKey:string;email:string;address:Record<string,string>;quote:ShippingQuote};
export type Order={id:string;cart_id:string;request_key:string;status:string;reserved:number;total:number;payment_id:string|null};
export function commerce(db:D1Database){
 const stmt=(sql:string,...v:unknown[])=>db.prepare(sql).bind(...v);
 async function order(id:string){return stmt('SELECT * FROM orders WHERE id=?',id).first<Order>();}
 async function reserve(input:OrderInput){
  if(!input.cartId||!input.requestKey||input.requestKey.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)||input.email.length>254)throw new CommerceConflict('Datos de pedido no válidos.');
  for(const key of ['name','street','city','state','postalCode'])if(typeof input.address[key]!=='string'||!input.address[key].trim()||input.address[key].length>300)throw new CommerceConflict('Completa la dirección.');
  if(!/^\d{5}$/.test(input.address.postalCode))throw new CommerceConflict('Código postal no válido.');
  if(input.quote.cartId!==input.cartId||input.quote.expiresAt<=Date.now()||!Number.isSafeInteger(input.quote.amountCents)||input.quote.amountCents<0)throw new CommerceConflict('La cotización de envío no es válida.');
  const previous=await stmt('SELECT * FROM orders WHERE request_key=?',input.requestKey).first<Order>();
  if(previous){if(previous.cart_id!==input.cartId)throw new CommerceConflict('Solicitud no válida.');return previous;}
  const id=crypto.randomUUID(),date=new Date().toISOString(),address=JSON.stringify(input.address);
  try{await db.batch([
   stmt(`INSERT INTO operation_guards(id,valid) SELECT ?,CASE WHEN
    EXISTS(SELECT 1 FROM cart_items WHERE cart_id=?) AND
    NOT EXISTS(SELECT 1 FROM cart_items ci LEFT JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=? AND (p.id IS NULL OR p.published<>1 OR ci.quantity<1 OR ci.quantity>p.stock OR p.price_cents<1)) AND
    NOT EXISTS(SELECT 1 FROM orders WHERE cart_id=? AND reserved=1 AND status='pending_payment') AND
    NOT EXISTS(SELECT 1 FROM settings WHERE id='vacation' AND json_extract(value,'$.enabled')=1 AND json_extract(value,'$.acceptOrders')<>1)
    THEN 1 ELSE 0 END`,id,input.cartId,input.cartId,input.cartId),
   stmt(`INSERT INTO orders(id,cart_id,request_key,reserved,status,email,address,subtotal,shipping,total,created_at)
    SELECT ?,?,?,1,'pending_payment',?,?,SUM(p.price_cents*ci.quantity),?,SUM(p.price_cents*ci.quantity)+?,?
    FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?`,id,input.cartId,input.requestKey,input.email,address,input.quote.amountCents,input.quote.amountCents,date,input.cartId),
   stmt(`INSERT INTO order_items(id,order_id,product_id,title,quantity,price_cents)
    SELECT ? || ':' || ci.product_id,?,ci.product_id,p.title,ci.quantity,p.price_cents FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.cart_id=?`,id,id,input.cartId),
   stmt(`UPDATE products SET stock=stock-(SELECT oi.quantity FROM order_items oi WHERE oi.order_id=? AND oi.product_id=products.id),updated_at=? WHERE id IN(SELECT product_id FROM order_items WHERE order_id=?)`,id,date,id),
   stmt('DELETE FROM operation_guards WHERE id=?',id)
  ]);}catch{
   const existing=await stmt('SELECT * FROM orders WHERE request_key=? AND cart_id=?',input.requestKey,input.cartId).first<Order>();
   if(existing)return existing;
   throw new CommerceConflict('Cambió la disponibilidad o ya hay un pedido en proceso. Revisa el carrito.');
  }
  return (await order(id))!;
 }
 async function cancel(id:string){
  // The conditional stock update and status change share one transaction. Repeating is harmless.
  await db.batch([
   stmt(`UPDATE products SET stock=stock+(SELECT oi.quantity FROM order_items oi WHERE oi.order_id=? AND oi.product_id=products.id) WHERE id IN(SELECT product_id FROM order_items WHERE order_id=?) AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='pending_payment' AND reserved=1)`,id,id,id),
   stmt("UPDATE orders SET status='cancelled',reserved=0 WHERE id=? AND status='pending_payment' AND reserved=1",id)
  ]);
  return order(id);
 }
 async function confirmVerifiedPayment(input:{orderId:string;provider:string;eventId:string;paymentId:string;amountCents:number;currency:string;paymentForm:string}){
  // Only a server adapter that verified the provider signature and fetched the payment may call this.
  if(!input.provider||!input.eventId||!input.paymentId||input.currency!=='MXN'||!/^\d{2}$/.test(input.paymentForm)||!Number.isSafeInteger(input.amountCents))throw new CommerceConflict('Pago no válido.');
  const key=input.provider+':'+input.eventId;
  const previous=await stmt('SELECT status FROM external_events WHERE key=?',key).first();if(previous)return {duplicate:true};
  const current=await order(input.orderId);if(!current)throw new CommerceConflict('Pedido no encontrado.');
  const guard=crypto.randomUUID();
  try{await db.batch([
   stmt("INSERT INTO operation_guards(id,valid) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM orders WHERE id=? AND total=? AND ((status='pending_payment' AND reserved=1) OR (status='paid' AND payment_id=?))) THEN 1 ELSE 0 END",guard,input.orderId,input.amountCents,input.paymentId),
   stmt('INSERT INTO external_events(key,provider,status,created_at) VALUES(?,?,?,?)',key,input.provider,'processed',new Date().toISOString()),
   stmt("UPDATE orders SET status='paid',payment_id=?,payment_form=? WHERE id=? AND status='pending_payment' AND reserved=1",input.paymentId,input.paymentForm,input.orderId),
   stmt('DELETE FROM operation_guards WHERE id=?',guard)
  ]);}catch{if(await stmt('SELECT key FROM external_events WHERE key=?',key).first())return {duplicate:true};throw new CommerceConflict('El pago requiere revisión: estado, importe o identificador no coinciden.');}
  return {duplicate:false};
 }
 return {reserve,cancel,confirmVerifiedPayment,order};
}
