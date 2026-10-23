import pg from 'pg';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2});
const base=process.env.PUBLIC_API_URL;
async function api(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{authorization:`Bearer ${process.env.INTEGRATION_TOKEN}`,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error(`HTTP_${r.status}`);return r.json();}
let stopping=false;
process.on('SIGTERM',()=>{stopping=true;});
process.on('SIGINT',()=>{stopping=true;});
async function cycle(){
  let imported=0,delivered=0;
  // Entrega primero la cola privada. La versión detecta cambios públicos concurrentes.
  const {rows:commands}=await pool.query('SELECT * FROM outbox WHERE delivered=false ORDER BY created_at LIMIT 50');
  for(const c of commands){
    const r=await api('/api/integration/commands',{commandId:c.command_id,bookingId:c.booking_id,baseVersion:c.base_version,status:c.status});
    await pool.query('UPDATE outbox SET delivered=true,result=$2 WHERE command_id=$1',[c.command_id,r.accepted?'aceptado':'conflicto']);delivered++;
    // Ante conflicto se invalida la copia local; el siguiente evento aplica la versión vigente.
    if(!r.accepted)await pool.query('UPDATE appointments SET source_version=0 WHERE id=$1',[c.booking_id]);
  }
  const events=await api('/api/integration/events');
  for(const b of events){
    await pool.query(`INSERT INTO appointments(id,doctor_id,visit_date,visit_time,contact_name,email,status,source_version)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,
      source_version=EXCLUDED.source_version WHERE appointments.source_version<EXCLUDED.source_version`,
      [b.id,b.doctor_id,b.visit_date,b.visit_time,b.contact_name,b.email,b.status,b.version]);
    await api('/api/integration/ack',{id:b.id,version:b.version});imported++;
  }
  console.log(JSON.stringify({event:'sync',imported,delivered}));
}
while(!stopping){try{await cycle();}catch(error){console.error(JSON.stringify({event:'sync_retry',code:error.code||'unavailable'}));}await new Promise(r=>setTimeout(r,Number(process.env.SYNC_INTERVAL_MS||3000)));}
await pool.end();
process.on('unhandledRejection',()=>process.exit(1));
