(function(){"use strict";
window.SantivanezPrivateSeed={
patients:[
{id:"PAC-FICT-001",documento:"DOC-TEST-1001",nombre:"Alba Prueba",correo:"alba.prueba@example.invalid",telefono:"+51 900 000 101",fechaNacimiento:"1988-04-12",medicoId:"med-001",estado:"Activo"},
{id:"PAC-FICT-002",documento:"DOC-TEST-1002",nombre:"Benito Muestra",correo:"benito.muestra@example.invalid",telefono:"+51 900 000 102",fechaNacimiento:"1979-11-03",medicoId:"med-002",estado:"Activo"},
{id:"PAC-FICT-003",documento:"DOC-TEST-1003",nombre:"Carla Ensayo",correo:"carla.ensayo@example.invalid",telefono:"+51 900 000 103",fechaNacimiento:"2018-02-19",medicoId:"med-003",estado:"Activo"},
{id:"PAC-FICT-004",documento:"DOC-TEST-1004",nombre:"Diego Demo",correo:"diego.demo@example.invalid",telefono:"+51 900 000 104",fechaNacimiento:"1991-07-08",medicoId:"med-004",estado:"Activo"},
{id:"PAC-FICT-005",documento:"DOC-TEST-1005",nombre:"Eva Ejemplo",correo:"eva.ejemplo@example.invalid",telefono:"+51 900 000 105",fechaNacimiento:"1984-01-22",medicoId:"med-005",estado:"Activo"},
{id:"PAC-FICT-006",documento:"DOC-TEST-1006",nombre:"Fabio Ficticio",correo:"fabio.ficticio@example.invalid",telefono:"+51 900 000 106",fechaNacimiento:"1972-10-16",medicoId:"med-001",estado:"Activo"},
{id:"PAC-FICT-007",documento:"DOC-TEST-1007",nombre:"Gina Prueba",correo:"gina.prueba@example.invalid",telefono:"+51 900 000 107",fechaNacimiento:"1996-05-30",medicoId:"med-002",estado:"Activo"},
{id:"PAC-FICT-008",documento:"DOC-TEST-1008",nombre:"Hugo Muestra",correo:"hugo.muestra@example.invalid",telefono:"+51 900 000 108",fechaNacimiento:"2016-09-14",medicoId:"med-003",estado:"Activo"}],
doctors:[
{id:"med-001",nombre:"Dra. Elena Prado Ficticia",especialidad:"Cardiología"},{id:"med-002",nombre:"Dr. Mateo Ríos Demostración",especialidad:"Dermatología"},{id:"med-003",nombre:"Dra. Lucía Campos Ejemplo",especialidad:"Pediatría"},{id:"med-004",nombre:"Dra. Sofía Luna Simulada",especialidad:"Ginecología"},{id:"med-005",nombre:"Dr. Bruno Vega Ficticio",especialidad:"Traumatología"}],
appointments:[
{uuid:"11111111-1111-4111-8111-111111111111",nombre:"Alba Prueba",correo:"alba.prueba@example.invalid",telefono:"+51 900 000 101",especialidad:"cardiologia",medico:"med-001",fecha:"2027-06-02",hora:"09:00",motivo:"Consulta preventiva de demostración",estado:"Pendiente",consentimiento:true,fechaRegistro:"2026-08-20T14:00:00.000Z"},
{uuid:"22222222-2222-4222-8222-222222222222",nombre:"Benito Muestra",correo:"benito.muestra@example.invalid",telefono:"+51 900 000 102",especialidad:"dermatologia",medico:"med-002",fecha:"2027-06-03",hora:"08:30",motivo:"Consulta programada de ejemplo",estado:"Confirmada",consentimiento:true,fechaRegistro:"2026-08-20T15:00:00.000Z",fechaActualizacion:"2026-08-25T16:00:00.000Z"},
{uuid:"33333333-3333-4333-8333-333333333333",nombre:"Carla Ensayo",correo:"carla.ensayo@example.invalid",telefono:"+51 900 000 103",especialidad:"pediatria",medico:"med-003",fecha:"2027-06-04",hora:"10:00",motivo:"Control preventivo ficticio",estado:"Reprogramada",consentimiento:true,fechaRegistro:"2026-08-21T10:00:00.000Z",fechaActualizacion:"2026-08-25T17:00:00.000Z"},
{uuid:"44444444-4444-4444-8444-444444444444",nombre:"Diego Demo",correo:"diego.demo@example.invalid",telefono:"+51 900 000 104",especialidad:"ginecologia",medico:"med-004",fecha:"2027-06-08",hora:"11:00",motivo:"Consulta general simulada",estado:"Pendiente",consentimiento:true,fechaRegistro:"2026-08-21T11:00:00.000Z"},
{uuid:"55555555-5555-4555-8555-555555555555",nombre:"Eva Ejemplo",correo:"eva.ejemplo@example.invalid",telefono:"+51 900 000 105",especialidad:"traumatologia",medico:"med-005",fecha:"2027-06-10",hora:"14:00",motivo:"Evaluación programada ficticia",estado:"Rechazada",consentimiento:true,fechaRegistro:"2026-08-22T12:00:00.000Z",fechaActualizacion:"2026-08-26T11:00:00.000Z"},
{uuid:"66666666-6666-4666-8666-666666666666",nombre:"Fabio Ficticio",correo:"fabio.ficticio@example.invalid",telefono:"+51 900 000 106",especialidad:"cardiologia",medico:"med-001",fecha:"2027-06-09",hora:"15:00",motivo:"Seguimiento preventivo simulado",estado:"Confirmada",consentimiento:true,fechaRegistro:"2026-08-22T13:00:00.000Z",fechaActualizacion:"2026-08-26T12:00:00.000Z"},
{uuid:"77777777-7777-4777-8777-777777777777",nombre:"Gina Prueba",correo:"gina.prueba@example.invalid",telefono:"+51 900 000 107",especialidad:"dermatologia",medico:"med-002",fecha:"2027-06-10",hora:"09:30",motivo:"Consulta ambulatoria de muestra",estado:"Cancelada",consentimiento:true,fechaRegistro:"2026-08-23T09:00:00.000Z",fechaActualizacion:"2026-08-26T13:00:00.000Z"},
{uuid:"88888888-8888-4888-8888-888888888888",nombre:"Hugo Muestra",correo:"hugo.muestra@example.invalid",telefono:"+51 900 000 108",especialidad:"pediatria",medico:"med-003",fecha:"2027-06-11",hora:"16:00",motivo:"Control programado de demostración",estado:"Pendiente",consentimiento:true,fechaRegistro:"2026-08-23T10:00:00.000Z"},
{uuid:"99999999-9999-4999-8999-999999999999",nombre:"Inés Ensayo",correo:"ines.ensayo@example.invalid",telefono:"+51 900 000 109",especialidad:"ginecologia",medico:"med-004",fecha:"2027-06-15",hora:"15:00",motivo:"Consulta preventiva ficticia",estado:"Confirmada",consentimiento:true,fechaRegistro:"2026-08-24T11:00:00.000Z",fechaActualizacion:"2026-08-26T14:00:00.000Z"},
{uuid:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",nombre:"Jorge Demo",correo:"jorge.demo@example.invalid",telefono:"+51 900 000 110",especialidad:"traumatologia",medico:"med-005",fecha:"2027-06-17",hora:"08:00",motivo:"Evaluación general de ejemplo",estado:"Reprogramada",consentimiento:true,fechaRegistro:"2026-08-24T12:00:00.000Z",fechaActualizacion:"2026-08-26T15:00:00.000Z"}],
records:[
{id:"HC-FICT-001",pacienteId:"PAC-FICT-001",medicoId:"med-001",fecha:"2026-07-10",diagnostico:"Diagnóstico cardiovascular ficticio A",tratamiento:"Plan preventivo ficticio A",notas:"Registro académico sin valor clínico."},
{id:"HC-FICT-002",pacienteId:"PAC-FICT-002",medicoId:"med-002",fecha:"2026-07-12",diagnostico:"Diagnóstico dermatológico ficticio B",tratamiento:"Tratamiento simulado B",notas:"Caso completamente inventado."},
{id:"HC-FICT-003",pacienteId:"PAC-FICT-003",medicoId:"med-003",fecha:"2026-07-15",diagnostico:"Diagnóstico pediátrico ficticio C",tratamiento:"Plan de control simulado C",notas:"Sin información médica real."},
{id:"HC-FICT-004",pacienteId:"PAC-FICT-004",medicoId:"med-004",fecha:"2026-07-18",diagnostico:"Diagnóstico ginecológico ficticio D",tratamiento:"Tratamiento de demostración D",notas:"Ejemplo solo para interfaz."},
{id:"HC-FICT-005",pacienteId:"PAC-FICT-005",medicoId:"med-005",fecha:"2026-07-21",diagnostico:"Diagnóstico traumatológico ficticio E",tratamiento:"Plan físico simulado E",notas:"No usar para decisiones clínicas."},
{id:"HC-FICT-006",pacienteId:"PAC-FICT-006",medicoId:"med-001",fecha:"2026-07-25",diagnostico:"Diagnóstico cardiovascular ficticio F",tratamiento:"Seguimiento simulado F",notas:"Datos creados para prueba."}],
audit:[
{id:"AUD-001",fecha:"2026-08-20T13:00:00.000Z",usuario:"administrador",rol:"Administrador",accion:"Inicio de sesión simulado",resultado:"Correcto"},
{id:"AUD-002",fecha:"2026-08-20T14:05:00.000Z",usuario:"recepcion",rol:"Recepción",accion:"Importó reserva 11111111…",resultado:"Correcto"},
{id:"AUD-003",fecha:"2026-08-20T14:06:00.000Z",usuario:"recepcion",rol:"Recepción",accion:"Intentó importar UUID duplicado",resultado:"Rechazado"},
{id:"AUD-004",fecha:"2026-08-21T09:10:00.000Z",usuario:"medico",rol:"Médico",accion:"Consultó paciente PAC-FICT-001",resultado:"Correcto"},
{id:"AUD-005",fecha:"2026-08-21T09:15:00.000Z",usuario:"medico",rol:"Médico",accion:"Registró historia HC-FICT-006",resultado:"Correcto"},
{id:"AUD-006",fecha:"2026-08-22T11:00:00.000Z",usuario:"recepcion",rol:"Recepción",accion:"Confirmó cita 22222222…",resultado:"Correcto"},
{id:"AUD-007",fecha:"2026-08-23T16:00:00.000Z",usuario:"administrador",rol:"Administrador",accion:"Consultó auditoría",resultado:"Correcto"},
{id:"AUD-008",fecha:"2026-08-24T10:00:00.000Z",usuario:"recepcion",rol:"Recepción",accion:"Exportó respuesta de estado",resultado:"Correcto"},
{id:"AUD-009",fecha:"2026-08-25T12:00:00.000Z",usuario:"medico",rol:"Médico",accion:"Cerró sesión",resultado:"Correcto"},
{id:"AUD-010",fecha:"2026-08-26T15:00:00.000Z",usuario:"administrador",rol:"Administrador",accion:"Verificó configuración local",resultado:"Correcto"}]
};})();
