# Plan y resultados de pruebas

Fecha de ejecución local: **27 de agosto de 2026**.

| # | Prueba | Método | Resultado |
| ---: | --- | --- | --- |
| 1 | Carga de páginas | 14 HTML y 17 rutas HTTP | **Correcta:** todas respondieron 200 |
| 2 | Diseño responsive | 375×812, 768×1024 y 1366×768 | **Correcta:** navegación adaptada y sin overflow horizontal final |
| 3 | Registro de reserva | Formulario público válido | **Correcta:** mostró confirmación y código |
| 4 | Generación de UUID | Patrón UUID v4 | **Correcta:** `5dfa1331-ca14-484f-9a0d-cb341efea62a` cumplió el patrón |
| 5 | Validación de campos | HTML y validadores JS | **Correcta:** formatos, longitudes y listas positivas activos |
| 6 | Rechazo de fecha pasada | `2026-01-05` | **Correcta:** “La fecha debe ser futura” |
| 7 | Prevención de reserva duplicada | Repetir correo/médico/fecha/hora | **Correcta:** segundo registro rechazado |
| 8 | Persistencia LocalStorage | Navegar y consultar UUID | **Correcta:** la reserva reapareció tras cambiar de página |
| 9 | Exportación JSON | Ejecutar exportación y revisar esquema | **Correcta:** acción preparada; doce claves exactas y sin campos clínicos |
| 10 | Rechazo de archivo inválido | Campo `diagnostico` y clave extra | **Correcta:** archivo rechazado por ambas condiciones |
| 11 | Importación privada | UUID `bbbbbbbb-…` | **Correcta:** apareció en Gestión de citas |
| 12 | UUID importado duplicado | Reimportar el mismo archivo | **Correcta:** “El UUID ya fue importado anteriormente” |
| 13 | Cambio de estado | Pendiente → Confirmada | **Correcta:** tabla actualizada y auditoría registrada |
| 14 | Exportación de respuesta | Ejecutar exportación y revisar esquema | **Correcta:** cinco claves exactas; interfaz confirmó la preparación |
| 15 | Importación pública del estado | Respuesta del mismo UUID | **Correcta:** consulta pública pasó a Confirmada |
| 16 | Inicio de sesión | Credencial inválida y tres perfiles | **Correcta:** inválida rechazada; perfiles válidos reconocidos |
| 17 | Restricción por roles | Recepción, Médico y Administrador | **Correcta:** menús, acciones, datos asignados y rutas restringidas |
| 18 | Protección de páginas | Abrir dashboard sin sesión | **Correcta:** redirección a `login.html?motivo=sesion` |
| 19 | Docker Compose | `docker compose up --build -d` | **Correcta:** ambas imágenes construidas |
| 20 | Puertos 8080 y 8081 | HTTP y health checks | **Correcta:** ambos contenedores saludables y `ok` |
| 21 | Dockerfile público | Build con Nginx Alpine y `nginx -t` | **Correcta:** configuración válida |
| 22 | Compatibilidad Render | Ejecutar imagen con `PORT=10000` | **Correcta localmente:** `/` respondió 200 y `/health` devolvió `ok` |
| 23 | Ausencia de historias en público | Contenido de imagen y claves JSON | **Correcta:** cero archivos privados y cero objetos con claves clínicas |
| 24 | Consola sin errores críticos | Recorrido final de 7 páginas públicas y 6 privadas | **Correcta:** cero errores y advertencias en el recorrido final |

## Criterio

Una prueba se marca **Correcta** cuando el comportamiento observado coincide con el esperado. Si una capacidad depende de una cuenta externa o despliegue no autorizado, se marca **No ejecutada** y no se presenta como exitosa.

## Comprobaciones adicionales

- 15 archivos JavaScript pasaron la comprobación de sintaxis.
- 7 archivos JSON iniciales se analizaron correctamente.
- Las 14 páginas no contienen referencias locales rotas.
- No hay controladores de eventos HTML inline, uso de `innerHTML` dinámico ni URLs runtime externas.
- Nginx validó la sintaxis de ambas configuraciones.
- La imagen pública fue inspeccionada y no contiene rutas denominadas `private`, `historia`, `paciente` o `auditoria`.
- Los datos iniciales verificados incluyen 5 especialidades, 5 médicos, 8 pacientes, 10 reservas, 6 historias y al menos 10 entradas de auditoría.

## Correcciones surgidas durante QA

La primera pasada detectó y corrigió: un paréntesis faltante en la inicialización de LocalStorage privado, una regla CSS que dejaba visibles enlaces ocultos por rol y un ancho mínimo de tarjetas que producía overflow en móvil. Después de reconstruir, se repitieron los recorridos y no aparecieron errores de consola.

## No ejecutado externamente

No se creó repositorio GitHub, servicio Render ni dominio público. La prueba 22 demuestra compatibilidad local con el contrato de puerto, no un despliegue exitoso en Render.
