import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const env=Object.fromEntries(readFileSync('.env','utf8').trim().split(/\r?\n/).map(s=>s.split('=')));
const config={DATABASE_URL:`postgres://clinic_app:${env.PUBLIC_APP_PASSWORD}@public-db:5432/bookings`,INTEGRATION_TOKEN:env.INTEGRATION_TOKEN,APP_ORIGIN:'http://localhost:10000',COOKIE_SECURE:'false'};
const file='.env.render-check',name='santivanez-apf2-render-check';
const run=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
writeFileSync(file,Object.entries(config).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});
let created=false;
try{
 run('create','--name',name,'--network','santivanez-apf2_public-data','--publish','127.0.0.1:10000:10000','--env-file',file,'santivanez-apf2-render:2.0');created=true;
 run('network','connect','santivanez-apf2_edge',name);run('start',name);
 let status;for(let i=0;i<15;i++){try{const r=await fetch('http://localhost:10000/health');if(r.ok){status=await r.json();break;}}catch{}await new Promise(r=>setTimeout(r,500));}
 assert.equal(status?.mode,'public');
 assert.equal((await fetch('http://localhost:10000/api/records')).status,404);
 const files=JSON.parse(run('exec',name,'node','-e',"const fs=require('node:fs');console.log(JSON.stringify({privatePortal:fs.existsSync('/app/app/private'),privateSchema:fs.existsSync('/app/infra/sql/private.sql'),worker:fs.existsSync('/app/app/worker')}))"));
 assert.deepEqual(files,{privatePortal:false,privateSchema:false,worker:false});
 writeFileSync('docs/evidencias/E-11-compatibilidad-render.json',JSON.stringify({executedAt:new Date().toISOString(),scope:'Prueba local de imagen; no es despliegue en Render',port:10000,health:status,privateFiles:files,result:'PASS'},null,2)+'\n');
 console.log('Imagen pública verificada en PORT=10000; sin portal, esquema ni agente privados. No se creó ningún servicio cloud.');
}finally{if(created)run('rm','-f',name);unlinkSync(file);}
