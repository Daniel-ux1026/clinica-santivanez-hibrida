import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
if(existsSync('.env')){console.log('Ya existe .env. Se conservó sin cambios.');process.exit(0);}
const secret=()=>randomBytes(24).toString('hex');
const values=Object.fromEntries(['PUBLIC_DB_PASSWORD','PRIVATE_DB_PASSWORD','PUBLIC_APP_PASSWORD','PRIVATE_APP_PASSWORD','INTEGRATION_TOKEN','RECEPTION_PASSWORD','DOCTOR_PASSWORD','ADMIN_PASSWORD'].map(k=>[k,secret()]));
writeFileSync('.env',Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\n',{mode:0o600});
writeFileSync('config/accesos-locales.txt',`ACCESOS EXCLUSIVOS DEL LABORATORIO LOCAL\nNo versionar, compartir ni mostrar en el video.\nPortal: http://localhost:8081\n\nrecepcion: ${values.RECEPTION_PASSWORD}\nmedico: ${values.DOCTOR_PASSWORD}\nadministrador: ${values.ADMIN_PASSWORD}\n\nLas contraseñas se cargan solo al crear por primera vez los usuarios.\nCambiar .env no cambia contraseñas de usuarios que ya existen en PostgreSQL.\n`,{mode:0o600});
console.log('Configuración local generada. Consulta config/accesos-locales.txt para iniciar sesión. No se mostraron secretos.');
