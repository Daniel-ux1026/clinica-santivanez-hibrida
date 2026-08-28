# Despliegue público en Render

## Servicio permitido

Solo se despliega `public-cloud`. No crear un servicio desde la raíz con un contexto Docker que incluya `private-cloud`.

## Blueprint recomendado

El `render.yaml` de la raíz declara:

- tipo `web`;
- runtime `docker`;
- rama `main`;
- directorio raíz `public-cloud`;
- Dockerfile `./Dockerfile` relativo al directorio raíz;
- contexto Docker `.` relativo al directorio raíz;
- health check `/health`;
- despliegue automático en cada commit;
- `PORT=10000`.

## Pasos

1. Verificar la cuenta GitHub y el repositorio exacto.
2. Subir el proyecto a `main`.
3. En Render elegir **New → Blueprint** y enlazar el repositorio.
4. Revisar el único recurso propuesto: `clinica-santivanez-publica`.
5. Confirmar que no aparece ningún servicio privado.
6. Aplicar el Blueprint.
7. Revisar Events y Logs; buscar errores de build, inicio o health check.
8. Abrir el subdominio asignado y confirmar que el banner diga “Entorno público: Render Cloud”.
9. Probar reserva, consulta, exportación e importación con datos ficticios.
10. Sustituir las URL pendientes en README solo después de verificarlas.

## Alternativa con el formulario de Web Service

- Language/Runtime: Docker.
- Branch: `main`.
- Root Directory: `public-cloud`.
- Dockerfile Path: `./Dockerfile`.
- Docker Build Context: `.`.
- Health Check Path: `/health`.
- Auto Deploy: On Commit.

## Actualizaciones y operación

Cada `git push origin main` dispara un despliegue si Auto Deploy sigue activo. Use **Logs** para inspeccionar Nginx y **Events** para el ciclo del deploy. Para suspender o eliminar, abra **Settings** del servicio público correcto y use la acción correspondiente con confirmación.

Documentación oficial de referencia:

- https://render.com/docs/docker
- https://render.com/docs/blueprint-spec
- https://render.com/docs/health-checks
- https://render.com/docs/environment-variables

No se afirma que el despliegue esté completo: no se creó un servicio ni se verificó una URL pública durante la preparación local.
