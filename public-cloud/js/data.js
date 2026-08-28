(function () {
  "use strict";
  window.SantivanezPublicData = {
    specialties: [
      { id: "cardiologia", name: "Cardiología", icon: "♥", description: "Evaluación preventiva y seguimiento cardiovascular ambulatorio." },
      { id: "dermatologia", name: "Dermatología", icon: "✦", description: "Consulta de piel, cabello y uñas con atención programada." },
      { id: "pediatria", name: "Pediatría", icon: "☀", description: "Controles y orientación de salud para niñas y niños." },
      { id: "ginecologia", name: "Ginecología", icon: "♀", description: "Atención preventiva y consulta ginecológica especializada." },
      { id: "traumatologia", name: "Traumatología", icon: "✚", description: "Evaluación musculoesquelética y control de lesiones." }
    ],
    doctors: [
      { id: "med-001", name: "Dra. Elena Prado Ficticia", specialty: "cardiologia", license: "CMP-FICT-1001", days: ["Lunes", "Miércoles"], hours: ["09:00", "10:00", "11:00", "15:00"] },
      { id: "med-002", name: "Dr. Mateo Ríos Demostración", specialty: "dermatologia", license: "CMP-FICT-1002", days: ["Martes", "Jueves"], hours: ["08:30", "09:30", "14:30", "15:30"] },
      { id: "med-003", name: "Dra. Lucía Campos Ejemplo", specialty: "pediatria", license: "CMP-FICT-1003", days: ["Lunes", "Viernes"], hours: ["09:00", "10:00", "16:00", "17:00"] },
      { id: "med-004", name: "Dra. Sofía Luna Simulada", specialty: "ginecologia", license: "CMP-FICT-1004", days: ["Martes", "Miércoles"], hours: ["10:00", "11:00", "15:00", "16:00"] },
      { id: "med-005", name: "Dr. Bruno Vega Ficticio", specialty: "traumatologia", license: "CMP-FICT-1005", days: ["Jueves", "Viernes"], hours: ["08:00", "09:00", "14:00", "15:00"] }
    ]
  };
})();
