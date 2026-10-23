// Ejecutar dentro de sync-agent: no imprime tokens ni payloads de reservas.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const base=process.env.PUBLIC_API_URL;
async function call(path,body,auth=false,token){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(auth?{authorization:`Bearer ${process.env.INTEGRATION_TOKEN}`}:{}) ,...(token?{'x-booking-token':token}:{})},body:body?JSON.stringify(body):undefined});assert.ok(r.ok);return r.json();}
const catalog=await call('/api/catalog');const d=new Date(catalog.today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+2);if(d.getUTCDay()===0)d.setUTCDate(d.getUTCDate()+1);
const date=d.toISOString().slice(0,10);const a=await call(`/api/availability?doctorId=med-005&date=${date}`);assert.ok(a.hours.length);
const b=await call('/api/bookings',{doctorId:'med-005',date,time:a.hours[0],name:'Caso de protocolo sintético',email:'protocolo@example.invalid',privacyAccepted:true,reminderConsent:false});
const command={commandId:randomUUID(),bookingId:b.id,baseVersion:1,status:'Confirmada'};
const [x,y]=await Promise.all([call('/api/integration/commands',command,true),call('/api/integration/commands',command,true)]);
assert.deepEqual(x,y);assert.equal(x.accepted,true);assert.equal(x.version,2);
await call(`/api/bookings/${b.id}/cancel`,{},false,b.accessToken);
const stale=await call('/api/integration/commands',{...command,commandId:randomUUID()},true);
assert.equal(stale.accepted,false);
const current=await call(`/api/bookings/${b.id}`,null,false,b.accessToken);assert.equal(current.status,'Cancelada');assert.equal(current.version,3);
console.log(JSON.stringify({executedAt:new Date().toISOString(),repeatedCommand:'PASS: mismo resultado y una sola versión',staleCommand:'PASS: conflicto detectado y cancelación conservada',scope:'prueba interna del protocolo con datos sintéticos'}));
