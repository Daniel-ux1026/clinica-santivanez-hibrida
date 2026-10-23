import {randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

// Genera parámetros locales. Nunca imprime secretos ni inicia recursos facturables.
const args=Object.fromEntries(process.argv.slice(2).map(x=>x.replace(/^--/,'').split('=')));
if(!/^[a-f0-9]{40}$/.test(args.commit||''))throw new Error('Usa --commit=SHA_COMPLETO_REVISADO');
const paramFile=resolve('config/azure-local.parameters.json');
const accessFile=resolve('config/accesos-azure-local.txt');
if(existsSync(paramFile)||existsSync(accessFile))throw new Error('Ya existen parámetros o accesos Azure. No se sobrescriben credenciales.');
mkdirSync('tmp/azure',{recursive:true});mkdirSync('config',{recursive:true});
const key=resolve('tmp/azure/admin_key');
if(!existsSync(key+'.pub')){
  const r=spawnSync('ssh-keygen',['-q','-t','rsa','-b','2048','-N','','-f',key],{stdio:'ignore'});
  if(r.status!==0)throw new Error('No se pudo generar la llave RSA con ssh-keygen.');
}
const secretNames=['publicDbPassword','privateDbPassword','publicAppPassword','privateAppPassword','integrationToken','receptionPassword','doctorPassword','adminPassword'];
const secrets=Object.fromEntries(secretNames.map(n=>[n,randomBytes(32).toString('hex')]));
const parameters=Object.fromEntries(Object.entries({
  sourceCommit:args.commit,sshPublicKey:readFileSync(key+'.pub','utf8').trim(),
  publicVmSize:args['public-vm-size']||'Standard_B2ats_v2',privateVmSize:args['private-vm-size']||'Standard_B2als_v2',...secrets
}).map(([k,v])=>[k,{value:v}]));
writeFileSync(paramFile,JSON.stringify({$schema:'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',contentVersion:'1.0.0.0',parameters},null,2)+'\n',{mode:0o600,flag:'wx'});
writeFileSync(accessFile,'AZURE APF2 — solo datos sintéticos. Archivo local excluido de Git.\n'+
  `recepcion: ${secrets.receptionPassword}\nmedico: ${secrets.doctorPassword}\nadministrador: ${secrets.adminPassword}\n`+
  'El portal de personal solo escucha en loopback de la VM privada. Operar con Azure Run Command.\n', {mode:0o600,flag:'wx'});
console.log('Parámetros y accesos Azure generados en config/ (ignorados por Git). No se crearon recursos.');
