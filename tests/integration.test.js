import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const env=Object.fromEntries(readFileSync('.env','utf8').trim().split(/\r?\n/).map(l=>l.split('=')));
const pub='http://localhost:8080', priv='http://localhost:8081';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(base,path,body,headers={},method=body?'POST':'GET'){
 const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0],headers:r.headers};
}
async function login(username,key){const r=await request(priv,'/api/login',{username,password:env[key]});assert.equal(r.status,200);return r;}
async function until(fn,check){for(let i=0;i<15;i++){const r=await fn();if(check(r))return r;await sleep(1000);}throw new Error('La sincronización no terminó dentro de 15 segundos');}
const results=[];
async function check(name,fn){const start=performance.now();await fn();results.push({name,result:'PASS',milliseconds:Math.round(performance.now()-start)});}
test('Validación integral del laboratorio APF2',async()=>{
 const catalog=await request(pub,'/api/catalog');let receipt,staff,doctor,admin;
 await check('T01 Salud de API pública y privada',async()=>{for(const base of [pub,priv]){const r=await request(base,'/health');assert.equal(r.status,200);assert.equal(r.data.status,'ok');}});
 await check('T02 Catálogo de cinco especialidades',async()=>{assert.equal(catalog.status,200);assert.equal(catalog.data.doctors.length,5);});
 const date=new Date(`${catalog.data.today}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+1);if(date.getUTCDay()===0)date.setUTCDate(date.getUTCDate()+1);
 let fixture={doctorId:'med-001',date:date.toISOString().slice(0,10),time:'09:00',name:'Persona sintética de prueba',email:'apf2@example.invalid',privacyAccepted:true,reminderConsent:false};
 // Elige un horario libre para permitir repetir las pruebas sin borrar volúmenes.
 for(let d=0;d<25;d++){if(date.getUTCDay()!==0){fixture.date=date.toISOString().slice(0,10);const r=await request(pub,`/api/availability?doctorId=med-001&date=${fixture.date}`);if(r.data.hours?.length){fixture.time=r.data.hours[0];break;}}date.setUTCDate(date.getUTCDate()+1);}
 await check('T03 Rechaza reserva sin aceptación del aviso',async()=>assert.equal((await request(pub,'/api/bookings',{...fixture,privacyAccepted:false})).status,400));
 await check('T04 Rechaza campos clínicos en la API pública',async()=>assert.equal((await request(pub,'/api/bookings',{...fixture,diagnostico:'DATO-FICTICIO'})).status,400));
 await check('T05 Rechaza fecha fuera del horizonte',async()=>assert.equal((await request(pub,'/api/bookings',{...fixture,date:'2099-01-01'})).status,400));
 await check('T06 Dos solicitudes concurrentes generan 201 y 409',async()=>{const r=await Promise.all([request(pub,'/api/bookings',fixture),request(pub,'/api/bookings',fixture)]);assert.deepEqual(r.map(x=>x.status).sort(),[201,409]);receipt=r.find(x=>x.status===201).data;assert.equal(receipt.status,'Solicitada');});
 await check('T07 El UUID solo no permite consultar una reserva',async()=>assert.equal((await request(pub,`/api/bookings/${receipt.id}`)).status,401));
 await check('T08 Clave incorrecta rechazada y clave válida aceptada',async()=>{assert.equal((await request(pub,`/api/bookings/${receipt.id}`,null,{'x-booking-token':'incorrecta'})).status,401);const r=await request(pub,`/api/bookings/${receipt.id}`,null,{'x-booking-token':receipt.accessToken});assert.equal(r.status,200);assert.equal(r.data.status,'Solicitada');assert.equal('email' in r.data,false);});
 await check('T09 El servicio público no expone historias ni integración por el gateway',async()=>{assert.equal((await request(pub,'/api/records')).status,404);assert.equal((await request(pub,'/api/integration/events')).status,404);assert.equal((await request(pub,'/data/historias.json')).status,404);});
 await check('T10 Acceso privado sin sesión rechazado',async()=>assert.equal((await request(priv,'/api/appointments')).status,401));
 await check('T11 Login inválido rechazado',async()=>assert.equal((await request(priv,'/api/login',{username:'recepcion',password:'incorrecta'})).status,401));
 await check('T12 Sesión HttpOnly y SameSite Strict',async()=>{staff=await login('recepcion','RECEPTION_PASSWORD');assert.match(staff.headers.get('set-cookie'),/HttpOnly/i);assert.match(staff.headers.get('set-cookie'),/SameSite=Strict/i);});
 await check('T13 Recepción no consulta registros clínicos ni auditoría',async()=>{for(const path of ['/api/records','/api/audit'])assert.equal((await request(priv,path,null,{cookie:staff.cookie})).status,403);});
 await check('T14 Sincronización pública a privada automática',async()=>{await until(()=>request(priv,'/api/appointments',null,{cookie:staff.cookie}),r=>r.data.some(x=>x.id===receipt.id));});
 await check('T15 Recepción confirma y el estado retorna al portal público',async()=>{assert.equal((await request(priv,`/api/appointments/${receipt.id}`,{status:'Confirmada'},{cookie:staff.cookie},'PATCH')).status,200);await until(()=>request(pub,`/api/bookings/${receipt.id}`,null,{'x-booking-token':receipt.accessToken}),r=>r.data.status==='Confirmada');});
 await check('T16 Médico consulta solo su registro asignado',async()=>{doctor=await login('medico','DOCTOR_PASSWORD');const r=await request(priv,'/api/records',null,{cookie:doctor.cookie});assert.equal(r.status,200);assert.equal(r.data.length,1);assert.equal(r.data[0].id,'HC-DEMO-001');});
 await check('T17 Médico no cambia estado de citas',async()=>assert.equal((await request(priv,`/api/appointments/${receipt.id}`,{status:'Cancelada'},{cookie:doctor.cookie},'PATCH')).status,403));
 await check('T18 Administración ve auditoría y métricas sin acceso clínico',async()=>{admin=await login('administrador','ADMIN_PASSWORD');assert.equal((await request(priv,'/api/records',null,{cookie:admin.cookie})).status,403);assert.equal((await request(priv,'/api/audit',null,{cookie:admin.cookie})).status,200);assert.equal((await request(priv,'/api/metrics',null,{cookie:admin.cookie})).status,200);});
 await check('T19 Rechaza solicitud de origen ajeno',async()=>assert.equal((await request(priv,`/api/appointments/${receipt.id}`,{status:'Cancelada'},{cookie:staff.cookie,origin:'https://otro.example.invalid'},'PATCH')).status,403));
 await check('T20 Persistencia tras recrear los dos contenedores de base de datos',async()=>{
   execFileSync('docker',['compose','up','-d','--force-recreate','--wait','public-db','clinical-db'],{stdio:'pipe',timeout:90000});
   await until(()=>request(pub,`/api/bookings/${receipt.id}`,null,{'x-booking-token':receipt.accessToken}),r=>r.status===200);
   assert.equal((await request(pub,`/api/bookings/${receipt.id}`,null,{'x-booking-token':receipt.accessToken})).data.status,'Confirmada');
   const r=await request(priv,'/api/records',null,{cookie:doctor.cookie});assert.equal(r.status,200);assert.equal(r.data[0].id,'HC-DEMO-001');
 });
 await check('T21 Cancelación autorizada e idempotente',async()=>{for(let i=0;i<2;i++){const r=await request(pub,`/api/bookings/${receipt.id}/cancel`,{},{'x-booking-token':receipt.accessToken});assert.equal(r.status,200);assert.equal(r.data.status,'Cancelada');}});
 await check('T22 Cancelación sincronizada y horario liberado',async()=>{await until(()=>request(priv,'/api/appointments',null,{cookie:staff.cookie}),r=>r.data.find(x=>x.id===receipt.id)?.status==='Cancelada');const r=await request(pub,`/api/availability?doctorId=med-001&date=${fixture.date}`);assert.ok(r.data.hours.includes(fixture.time));});
 await check('T23 Reintentos de sincronización no duplican la cita',async()=>{await sleep(4000);const r=await request(priv,'/api/appointments',null,{cookie:staff.cookie});assert.equal(r.data.filter(x=>x.id===receipt.id).length,1);});
 await check('T24 Cierre de sesión invalida el acceso',async()=>{await request(priv,'/api/logout',{}, {cookie:staff.cookie});assert.equal((await request(priv,'/api/me',null,{cookie:staff.cookie})).status,401);});
 for(const s of [doctor,admin])await request(priv,'/api/logout',{}, {cookie:s.cookie});
 writeFileSync('docs/evidencias/E-04-pruebas.json',JSON.stringify({executedAt:new Date().toISOString(),environment:'Docker Desktop local, datos sintéticos',tests:results,total:results.length,passed:results.length,failed:0},null,2)+'\n');
 console.log(`${results.length} pruebas verificadas. Evidencia E-04-pruebas.json. No se imprimieron claves ni datos personales.`);
});
