# Preparación del despliegue público en Render

Estado: **PARCIALMENTE IMPLEMENTADO**. La imagen se construyó y probó localmente en puerto 10000 (E-11). No hay URL cloud de esta versión, recursos contratados ni conexión real entre Render y la clínica.

1. Revisar la rama APF2 y sus evidencias en el repositorio GitHub autorizado. Conservar `main` hasta aprobar los cambios.
2. Revisar en `render.yaml` la región y los planes, sus costos vigentes, contratos, disponibilidad y tratamiento de datos. La selección del archivo es provisional; aplicar un Blueprint puede crear servicios de pago.
3. Crear un Blueprint desde la rama aprobada. El contexto es la raíz y el Dockerfile es `docker/Dockerfile.render`. `autoDeployTrigger: off` evita desplegar automáticamente por cada commit.
4. Render obtiene `DATABASE_URL` desde la base administrada y genera `INTEGRATION_TOKEN`. Mantener el token en secretos de servidor y configurar el mismo valor en el agente privado por un canal seguro.
5. La imagen escucha en `0.0.0.0:$PORT` (10000 por defecto). Node sirve HTML/CSS/JS y API pública. El health check es `/health`.
6. Verificar dominio HTTPS, salud, validación de citas, ausencia de rutas clínicas, acceso SQL interno y restricciones de acceso externo de la base. `ipAllowList: []` solicita bloquear conexiones externas de PostgreSQL.
7. Configurar el agente clínico con la URL HTTPS real y credenciales de mínimo privilegio. El agente local del Compose está conectado a dos redes Docker internas; trasladarlo exige configurar salida HTTPS y gestión de secretos en la infraestructura privada real.
8. Guardar evidencias nuevas. La prueba E-11 es local y no valida TLS de Render, su plan, conectividad remota, recuperación administrada ni conformidad para datos reales.

El archivo no crea un servicio para el portal privado. No se adopta Supabase, que no fue confirmado como sustituto de Render PostgreSQL. No se prevén dos bases públicas equivalentes.

Fuentes verificadas el 22/10/2026: [Docker en Render](https://render.com/docs/docker), [Blueprint YAML](https://render.com/docs/blueprint-spec), [red privada](https://render.com/docs/private-network). Las condiciones y planes se deben revisar de nuevo al contratar.
