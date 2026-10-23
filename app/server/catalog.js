export const doctors = [
  {id:'med-001',specialty:'Cardiología',name:'Especialista de cardiología',initials:'CA'},
  {id:'med-002',specialty:'Dermatología',name:'Especialista de dermatología',initials:'DE'},
  {id:'med-003',specialty:'Pediatría',name:'Especialista de pediatría',initials:'PE'},
  {id:'med-004',specialty:'Ginecología',name:'Especialista de ginecología',initials:'GI'},
  {id:'med-005',specialty:'Traumatología',name:'Especialista de traumatología',initials:'TR'}
];
export const hours = ['09:00','10:00','11:00','15:00','16:00'];
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`), start = new Date(`${today()}T12:00:00Z`);
  return !Number.isNaN(+date) && date.toISOString().slice(0,10) === value && date > start && date-start <= 30*86400000 && date.getUTCDay() !== 0;
}
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
