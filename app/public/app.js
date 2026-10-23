'use strict';
const $=s=>document.querySelector(s);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
async function api(path,options={}){const r=await fetch(path,{...options,headers:{'content-type':'application/json',...options.headers}});const data=await r.json();if(!r.ok)throw new Error(data.error||'No se pudo completar la solicitud');return data;}
function message(node,text,error=false){node.hidden=false;node.textContent=text;node.className='message'+(error?' error':'');}
function details(node,data){node.replaceChildren();Object.entries(data).forEach(([k,v])=>{node.append(el('dt',k),el('dd',String(v)));});}
let receipt=null,lookup=null,availabilityRequest=0;
async function availability(){
  const request=++availabilityRequest,doctorId=$('#doctor').value,date=$('#date').value;
  $('#time').disabled=true;$('#time').replaceChildren(new Option('Elige fecha primero',''));
  if(!doctorId||!date)return;
  $('#availability').textContent='Consultando disponibilidad…';
  try{const data=await api(`/api/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`);if(request!==availabilityRequest)return;
    $('#time').replaceChildren(new Option(data.hours.length?'Selecciona un horario':'Sin horarios disponibles',''));
    data.hours.forEach(h=>$('#time').add(new Option(h,h)));$('#time').disabled=!data.hours.length;
    $('#availability').textContent=data.hours.length?`${data.hours.length} horarios disponibles · hora de Lima`:'Prueba con otra fecha.';
  }catch(e){if(request===availabilityRequest)$('#availability').textContent=e.message;}
}
async function init(){try{
  const c=await api('/api/catalog');$('#specialty-grid').replaceChildren();
  const start=new Date(`${c.today}T12:00:00Z`);start.setUTCDate(start.getUTCDate()+1);$('#date').min=start.toISOString().slice(0,10);
  const end=new Date(`${c.today}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+30);$('#date').max=end.toISOString().slice(0,10);
  c.doctors.forEach(d=>{const button=el('button',undefined,'specialty');button.type='button';button.append(el('span',d.initials,'symbol'),el('strong',d.specialty),el('small','Ver horarios →'));button.addEventListener('click',()=>{$('#doctor').value=d.id;availability();$('#reservar').scrollIntoView({behavior:'smooth'});});$('#specialty-grid').append(button);$('#doctor').add(new Option(d.specialty,d.id));});
}catch(e){$('#specialty-grid').textContent='El catálogo no está disponible. Revisa que los servicios estén iniciados.';message($('#booking-message'),e.message,true);}}
$('#doctor').addEventListener('change',availability);$('#date').addEventListener('change',availability);
$('#booking-form').addEventListener('submit',async event=>{
  event.preventDefault();const f=event.currentTarget,b=Object.fromEntries(new FormData(f));b.privacyAccepted=f.elements.privacyAccepted.checked;b.reminderConsent=f.elements.reminderConsent.checked;
  $('#book-button').disabled=true;$('#booking-message').hidden=true;
  try{receipt=await api('/api/bookings',{method:'POST',body:JSON.stringify(b)});$('#booking-form').hidden=true;$('#receipt').hidden=false;
    details($('#receipt-details'),{'Estado':receipt.status,'Código':receipt.id,'Clave de consulta':receipt.accessToken,'Fecha y hora':`${receipt.date} · ${receipt.time}`});
  }catch(e){message($('#booking-message'),e.message,true);await availability();}finally{$('#book-button').disabled=false;}
});
$('#download-receipt').addEventListener('click',()=>{if(!receipt)return;const blob=new Blob([JSON.stringify({laboratorio:'Clínica Santivañez APF2 · datos ficticios',...receipt},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=el('a');a.href=u;a.download=`comprobante-${receipt.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
$('#new-booking').addEventListener('click',()=>{$('#receipt').hidden=true;$('#booking-form').hidden=false;$('#booking-form').reset();receipt=null;availability();});
function displayLookup(b){details($('#lookup-details'),{'Estado':b.status,'Fecha y hora':`${b.date} · ${b.time}`,'Código':b.id});$('#lookup-result').hidden=false;$('#cancel-booking').hidden=b.status==='Cancelada';$('#cancel-confirmation').hidden=true;}
$('#lookup-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;$('#lookup-message').hidden=true;$('#lookup-result').hidden=true;lookup={id:f.elements.id.value.trim(),token:f.elements.token.value.trim()};try{const b=await api(`/api/bookings/${encodeURIComponent(lookup.id)}`,{headers:{'x-booking-token':lookup.token}});displayLookup(b);}catch(error){message($('#lookup-message'),error.message,true);lookup=null;}});
$('#cancel-booking').addEventListener('click',()=>{$('#cancel-confirmation').hidden=false;});
$('#confirm-cancel').addEventListener('click',async()=>{if(!lookup)return;try{const b=await api(`/api/bookings/${encodeURIComponent(lookup.id)}/cancel`,{method:'POST',headers:{'x-booking-token':lookup.token},body:'{}'});displayLookup(b);message($('#lookup-message'),'Solicitud cancelada. El horario vuelve a estar disponible.');await availability();}catch(e){message($('#lookup-message'),e.message,true);}});
init();
