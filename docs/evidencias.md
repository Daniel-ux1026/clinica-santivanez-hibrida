# Guía de evidencias

La entrega puede acompañarse con las siguientes capturas, siempre con datos ficticios:

1. Portal público en escritorio y móvil.
2. Formulario de reserva validando una fecha pasada.
3. Confirmación de reserva y UUID generado.
4. Archivo de reserva mostrando sus doce claves permitidas.
5. Login privado y panel del rol Recepción.
6. Rechazo de un archivo JSON con `diagnostico`.
7. Prevención de UUID duplicado.
8. Gestión de una cita y exportación de estado.
9. Importación del estado en el portal público.
10. Restricción del rol Médico ante auditoría.
11. `docker compose ps` con ambos servicios saludables.
12. Respuestas `200` de los dos health checks.
13. Render Logs y URL pública, solo después de un despliegue real verificado.

## Convención sugerida

Guardar evidencias fuera de las imágenes Docker, por ejemplo en un directorio local `evidencias-locales/` no versionado si contienen datos de sesión. Antes de compartirlas, comprobar que no muestren correos, documentos, tokens, nombres o dominios reales.

## Evidencia registrada en la validación local

- Ambos contenedores aparecieron como `healthy`.
- Las 17 solicitudes HTTP respondieron con estado 200.
- Los endpoints `/health` devolvieron `ok`.
- La ejecución temporal del contenedor público con `PORT=10000` respondió 200.
- El navegador confirmó el UUID v4, la persistencia y el estado actualizado.
- La importación con `diagnostico` fue rechazada.
- La segunda importación del UUID `bbbbbbbb-…` fue rechazada como duplicada.
- Recepción no pudo ver ni abrir historias o auditoría; Médico vio solo 2 pacientes, 3 citas y 1 historia asignados; Administrador vio todas las áreas.
- El recorrido final produjo cero errores o advertencias de consola.

No se generaron capturas dentro del repositorio para evitar incorporar datos de sesión innecesarios. Este archivo no afirma que exista evidencia de Render: la publicación externa queda pendiente hasta verificar la cuenta y el repositorio del usuario.
