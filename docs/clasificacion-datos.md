# Clasificación y manejo de datos

| Información | Clasificación | Ubicación | Exportable | Regla de manejo |
| --- | --- | --- | --- | --- |
| Historia clínica | Crítica y sensible | Entorno privado | No | Nunca publicar ni incluir en JSON |
| Diagnóstico | Crítica y sensible | Entorno privado | No | Solo demostración ficticia local |
| Tratamiento | Crítica y sensible | Entorno privado | No | Solo demostración ficticia local |
| Receta o resultado | Crítica y sensible | Entorno privado | No | Campo rechazado por importadores |
| Datos completos del paciente | Confidencial | Entorno privado | No | No exponer en Render |
| Documento ficticio | Confidencial | Entorno privado | No | Identificador administrativo de prueba |
| UUID de reserva | Restringida | Ambos entornos | Sí | Único vínculo entre mensajes |
| Fecha y hora de cita | Uso limitado | Ambos entornos | Sí | Solo coordinación |
| Especialidad | Uso limitado | Público y privado | Sí, en solicitud | No revela una condición clínica confirmada |
| Motivo general no clínico | Uso limitado | Ambos entornos | Sí, en solicitud | Longitud y caracteres restringidos |
| Contacto mínimo ficticio | Personal protegido | Público y privado | Sí, en solicitud | Solo datos de demostración |
| Estado de cita | Uso limitado | Ambos entornos | Sí | Parte de la respuesta mínima |
| Fecha de actualización | Uso limitado | Ambos entornos | Sí | Control básico de respuesta anterior/duplicada |
| Auditoría privada | Confidencial | Entorno privado | No | Local y manipulable en esta demo |
| Información institucional | Pública | Render | No aplica | Contenido libre de datos clínicos |

## Principios

- Minimización: recopilar solo lo necesario para coordinar la cita.
- Separación: impedir que el contexto de construcción pública alcance `private-cloud`.
- Denegación por defecto: si el JSON tiene una clave no reconocida se rechaza completo.
- Datos ficticios: correos usan el dominio reservado `.invalid` y los documentos se marcan como `DOC-TEST`.
