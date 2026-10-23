import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pool, migrate, hash, passwordMatches, transaction } from './db.js';
import { doctors, hours, today, validDate, uuidPattern } from './catalog.js';

const mode = process.env.APP_MODE;
if (!['public','private'].includes(mode)) throw new Error('APP_MODE debe ser public o private');
if (!process.env.INTEGRATION_TOKEN || process.env.INTEGRATION_TOKEN.length < 32) throw new Error('Configurar INTEGRATION_TOKEN');
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use(helmet({strictTransportSecurity: process.env.COOKIE_SECURE === 'true' ? undefined : false}));
app.use(express.json({limit:'8kb'}));
let requests=0, failures=0, elapsed=0;
app.use((req,res,next)=>{
  const start=performance.now();
  res.on('finish',()=>{ const ms=performance.now()-start; requests++; elapsed+=ms; if(res.statusCode>=500) failures++;
    if(req.path!=='/health') console.log(JSON.stringify({event:'http',mode,method:req.method,route:req.route?.path || 'static',status:res.statusCode,ms:Math.round(ms)})); });
  next();
});
app.use('/api',rateLimit({windowMs:60000,limit:150,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Demasiadas solicitudes. Espera un minuto.'}}));
app.use((req,res,next)=>{
  if (['POST','PATCH','DELETE'].includes(req.method)) {
    const origin=req.get('origin');
    const expected=process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
    if ((origin && origin!==expected) || req.get('sec-fetch-site')==='cross-site') return res.status(403).json({error:'Origen no permitido'});
    if (!req.is('application/json')) return res.status(415).json({error:'Se requiere JSON'});
  }
  res.set('Cache-Control','no-store'); next();
});
const fail=(res,status,error)=>res.status(status).json({error});
const exact=(body,keys)=>body && typeof body==='object' && !Array.isArray(body) && Object.keys(body).every(k=>keys.includes(k));
const clean=s=>typeof s==='string' && s.trim().length>1;
const summary=b=>({id:b.id,doctorId:b.doctor_id,date:b.visit_date.toISOString().slice(0,10),time:b.visit_time,status:b.status,version:b.version});
function integration(req,res,next) {
  const actual=Buffer.from(req.get('authorization') || ''), expected=Buffer.from(`Bearer ${process.env.INTEGRATION_TOKEN}`);
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected)) return fail(res,401,'No autorizado');
  next();
}
async function audit(actor,action,result) {await pool.query('INSERT INTO audit(actor,action,result) VALUES($1,$2,$3)',[actor,action,result]);}
async function session(req,res,next) {
  const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);
  if(!value) return fail(res,401,'Inicia sesión');
  const {rows}=await pool.query('SELECT s.id,s.username,s.role,s.doctor_id FROM sessions x JOIN staff s ON s.id=x.staff_id WHERE x.token_hash=$1 AND x.expires_at>now()',[hash(value)]);
  if(!rows.length) return fail(res,401,'Sesión vencida');
  req.user=rows[0]; next();
}
const role=(...allowed)=>(req,res,next)=>allowed.includes(req.user.role)?next():fail(res,403,'Tu rol no permite esta acción');

app.get('/health',async(req,res)=>{await pool.query('SELECT 1');res.json({status:'ok',mode,data:'synthetic'});});
if(mode==='public') {
  app.get('/api/catalog',(_req,res)=>res.json({doctors,hours,today:today(),daysAhead:30}));
  app.get('/api/availability',async(req,res)=>{
    const {doctorId,date}=req.query;
    if(!doctors.some(d=>d.id===doctorId)||!validDate(date)) return fail(res,400,'Elige un especialista y una fecha entre mañana y los próximos 30 días, de lunes a sábado');
    const {rows}=await pool.query("SELECT visit_time FROM bookings WHERE doctor_id=$1 AND visit_date=$2 AND status IN ('Solicitada','Confirmada')",[doctorId,date]);
    res.json({hours:hours.filter(h=>!rows.some(r=>r.visit_time===h))});
  });
  app.post('/api/bookings',rateLimit({windowMs:60000,limit:20,legacyHeaders:false}),async(req,res)=>{
    const b=req.body;
    if(!exact(b,['doctorId','date','time','name','email','privacyAccepted','reminderConsent']) ||
      !doctors.some(d=>d.id===b.doctorId)||!validDate(b.date)||!hours.includes(b.time)||
      !clean(b.name)||b.name.trim().length>80||typeof b.email!=='string'||b.email.length>120||!/^\S+@\S+\.\S+$/.test(b.email)||b.privacyAccepted!==true||typeof b.reminderConsent!=='boolean')
      return fail(res,400,'Revisa los datos y acepta el aviso de privacidad. No incluyas información médica.');
    const token=randomBytes(32).toString('base64url'),id=randomUUID();
    try {
      const {rows}=await pool.query('INSERT INTO bookings(id,token_hash,doctor_id,visit_date,visit_time,contact_name,email,reminder_consent,privacy_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [id,hash(token),b.doctorId,b.date,b.time,b.name.trim(),b.email.trim().toLowerCase(),b.reminderConsent,'APF2-demo-1']);
      res.status(201).json({...summary(rows[0]),accessToken:token});
    } catch(e) {if(e.code==='23505') return fail(res,409,'Ese horario acaba de ocuparse. Elige otro.');throw e;}
  });
  async function booking(req,res,next) {
    if(!uuidPattern.test(req.params.id)||typeof req.get('x-booking-token')!=='string') return fail(res,401,'Código o clave de consulta incorrectos');
    const {rows}=await pool.query('SELECT * FROM bookings WHERE id=$1 AND token_hash=$2',[req.params.id,hash(req.get('x-booking-token'))]);
    if(!rows.length) return fail(res,401,'Código o clave de consulta incorrectos');req.booking=rows[0];next();
  }
  app.get('/api/bookings/:id',booking,(req,res)=>res.json(summary(req.booking)));
  app.post('/api/bookings/:id/cancel',booking,async(req,res)=>{
    const {rows}=await pool.query("UPDATE bookings SET status='Cancelada',version=version+CASE WHEN status='Cancelada' THEN 0 ELSE 1 END,updated_at=now() WHERE id=$1 RETURNING *",[req.params.id]);
    res.json(summary(rows[0]));
  });
  app.get('/api/integration/events',integration,async(_req,res)=>{
    const {rows}=await pool.query('SELECT id,doctor_id,visit_date,visit_time,contact_name,email,status,version FROM bookings WHERE synced_version<version ORDER BY updated_at,id LIMIT 100');res.json(rows);
  });
  app.post('/api/integration/ack',integration,async(req,res)=>{
    const b=req.body;if(!exact(b,['id','version'])||!uuidPattern.test(b.id)||!Number.isInteger(b.version)||b.version<1)return fail(res,400,'Evento inválido');
    await pool.query('UPDATE bookings SET synced_version=GREATEST(synced_version,$2) WHERE id=$1 AND version>=$2',[b.id,b.version]);res.json({ok:true});
  });
  app.post('/api/integration/commands',integration,async(req,res)=>{
    const b=req.body;
    if(!exact(b,['commandId','bookingId','baseVersion','status'])||!uuidPattern.test(b.commandId)||!uuidPattern.test(b.bookingId)||!Number.isInteger(b.baseVersion)||!['Confirmada','Cancelada'].includes(b.status)) return fail(res,400,'Comando inválido');
    const result=await transaction(async c=>{
      // Serializa reintentos de un mismo comando, incluso desde procesos distintos.
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[b.commandId]);
      const prev=await c.query('SELECT result FROM integration_commands WHERE command_id=$1',[b.commandId]);
      if(prev.rows.length)return prev.rows[0].result;
      const {rows}=await c.query("UPDATE bookings SET status=$3,version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND status<>'Cancelada' RETURNING version",[b.bookingId,b.baseVersion,b.status]);
      const outcome={accepted:rows.length===1,version:rows[0]?.version||null};
      await c.query('INSERT INTO integration_commands(command_id,result) VALUES($1,$2)',[b.commandId,outcome]);return outcome;
    });res.json(result);
  });
} else {
  app.post('/api/login',rateLimit({windowMs:60000,limit:10,legacyHeaders:false}),async(req,res)=>{
    const b=req.body;if(!exact(b,['username','password'])||typeof b.username!=='string'||typeof b.password!=='string'||b.password.length>200)return fail(res,400,'Datos inválidos');
    const {rows}=await pool.query('SELECT * FROM staff WHERE username=$1',[b.username]);
    // Hash ficticio para que un usuario inexistente también ejecute scrypt.
    const stored=rows[0]?.password_hash || `${'0'.repeat(32)}:${'0'.repeat(128)}`;
    if(!passwordMatches(b.password,stored)){await audit('sesion','login','rechazado');return fail(res,401,'Credenciales incorrectas');}
    const token=randomBytes(32).toString('base64url');
    await pool.query('DELETE FROM sessions WHERE expires_at<now()');
    await pool.query("INSERT INTO sessions VALUES($1,$2,now()+interval '1 hour')",[hash(token),rows[0].id]);
    res.cookie('sid',token,{httpOnly:true,sameSite:'strict',secure:process.env.COOKIE_SECURE==='true',maxAge:3600000,path:'/api'});
    await audit(rows[0].username,'login','correcto');res.json({username:rows[0].username,role:rows[0].role});
  });
  app.get('/api/me',session,(req,res)=>res.json({username:req.user.username,role:req.user.role}));
  app.post('/api/logout',session,async(req,res)=>{
    const value=req.headers.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sid='))?.slice(4);
    await pool.query('DELETE FROM sessions WHERE token_hash=$1',[hash(value)]);res.clearCookie('sid',{path:'/api'});res.json({ok:true});
  });
  app.get('/api/appointments',session,async(req,res)=>{
    const {rows}=await pool.query('SELECT id,doctor_id,visit_date::text,visit_time,contact_name,status,source_version FROM appointments WHERE ($1::text IS NULL OR doctor_id=$1) ORDER BY visit_date,visit_time LIMIT 100',[req.user.role==='medico'?req.user.doctor_id:null]);res.json(rows);
  });
  app.patch('/api/appointments/:id',session,role('recepcion'),async(req,res)=>{
    if(!uuidPattern.test(req.params.id)||!exact(req.body,['status'])||!['Confirmada','Cancelada'].includes(req.body.status))return fail(res,400,'Estado inválido');
    const result=await transaction(async c=>{
      const {rows}=await c.query('SELECT * FROM appointments WHERE id=$1 FOR UPDATE',[req.params.id]);
      if(!rows.length)return {error:404};if(rows[0].status==='Cancelada')return {error:409};
      const pending=await c.query('SELECT 1 FROM outbox WHERE booking_id=$1 AND delivered=false',[req.params.id]);
      if(pending.rows.length)return {error:409};
      const commandId=randomUUID();await c.query('INSERT INTO outbox(command_id,booking_id,base_version,status) VALUES($1,$2,$3,$4)',[commandId,req.params.id,rows[0].source_version,req.body.status]);
      await c.query('UPDATE appointments SET status=$2 WHERE id=$1',[req.params.id,req.body.status]);
      return {commandId,status:req.body.status,sync:'pendiente'};
    });
    if(result.error)return fail(res,result.error,'La cita no está disponible o tiene un cambio pendiente');
    await audit(req.user.username,'cambiar_estado','encolado');res.json(result);
  });
  app.get('/api/records',session,role('medico'),async(req,res)=>{
    const {rows}=await pool.query('SELECT id,patient_label,clinical_note FROM clinical_records WHERE doctor_id=$1',[req.user.doctor_id]);
    await audit(req.user.username,'consultar_registros_sinteticos','correcto');res.json(rows);
  });
  app.get('/api/audit',session,role('administrador'),async(req,res)=>{const {rows}=await pool.query('SELECT * FROM audit ORDER BY id DESC LIMIT 50');res.json(rows);});
  app.get('/api/metrics',session,role('administrador'),async(req,res)=>{
    const {rows}=await pool.query('SELECT count(*)::integer AS pending FROM outbox WHERE delivered=false');
    res.json({requests,failures,meanResponseMs:requests?Math.round(elapsed/requests):0,pendingCommands:rows[0].pending,uptimeSeconds:Math.round(process.uptime())});
  });
}
app.use('/api',(_req,res)=>fail(res,404,'Recurso no disponible'));
app.use(express.static(fileURLToPath(new URL(`../${mode}/`,import.meta.url))));
app.use((_req,res)=>fail(res,404,'Página no disponible'));
app.use((error,req,res,_next)=>{
  console.error(JSON.stringify({event:'error',mode,code:error.code||error.type||'internal'}));
  const status=error.type==='entity.parse.failed'?400:error.type==='entity.too.large'?413:503;
  res.status(status).json({error:status===503?'Servicio temporalmente no disponible':'Solicitud inválida'});
});
await migrate(mode);
const server=app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log(JSON.stringify({event:'ready',mode,port:process.env.PORT||3000})));
async function stop(){server.close(async()=>{await pool.end();process.exit(0);});}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
