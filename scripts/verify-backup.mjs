import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const run=(...args)=>execFileSync('docker',['compose',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
mkdirSync('backups',{recursive:true});
const results=[];
for(const [service,database,tables]of [['public-db','bookings',['bookings','integration_commands']],['clinical-db','clinical',['appointments','clinical_records','audit']]]){
 const temporary=`apf2_restore_${Date.now()}`;
 const count=(db,table)=>Number(run('exec','-T',service,'psql','-U','clinic_owner','-d',db,'-Atc',`SELECT count(*) FROM ${table}`));
 const before=Object.fromEntries(tables.map(t=>[t,count(database,t)]));
 run('exec','-T',service,'pg_dump','-U','clinic_owner','-d',database,'-Fc','-f','/tmp/apf2-verify.dump');
 run('cp',`${service}:/tmp/apf2-verify.dump`,`backups/${database}.dump`);
 run('exec','-T',service,'createdb','-U','clinic_owner',temporary);
 try{
  run('exec','-T',service,'pg_restore','--exit-on-error','--no-owner','--no-acl','-U','clinic_owner','-d',temporary,'/tmp/apf2-verify.dump');
  const restored=Object.fromEntries(tables.map(t=>[t,count(temporary,t)]));assert.deepEqual(restored,before);
  results.push({service,source:database,restoredTo:'base temporal independiente eliminada tras verificar',rows:restored,sha256:createHash('sha256').update(readFileSync(`backups/${database}.dump`)).digest('hex'),result:'PASS'});
 }finally{run('exec','-T',service,'dropdb','-U','clinic_owner',temporary);}
}
writeFileSync('docs/evidencias/E-03-restauracion.json',JSON.stringify({executedAt:new Date().toISOString(),scope:'Datos sintéticos. Restauración en bases temporales; no se modificaron las bases de origen. Respaldos locales sin cifrar, excluidos de Git.',results},null,2)+'\n');
console.log('Restauración comprobada para las dos bases. Los respaldos están en backups/ y no se versionan.');
