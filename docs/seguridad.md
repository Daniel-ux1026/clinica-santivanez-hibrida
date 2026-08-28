# Revisión de seguridad

## Modelo de amenazas resumido

| Amenaza | Control del prototipo | Riesgo residual |
| --- | --- | --- |
| Inserción de HTML o script | Patrones, longitudes y renderizado dinámico con `textContent` | El cliente puede alterar su propio JS |
| Archivo JSON malicioso | Extensión, tamaño, parseo, esquema exacto, tipos y lista de claves sensibles | No existe firma digital ni antivirus |
| Duplicación o replay | UUID duplicado rechazado; respuesta anterior rechazada por fecha | Reloj y fecha pueden manipularse |
| Acceso sin sesión | Redirección desde pantallas privadas | Se puede evadir desde DevTools porque no hay servidor |
| Exceso de privilegios | Menús, páginas y acciones condicionadas por rol | Control solamente del lado cliente |
| Publicación accidental de datos privados | Contexto Docker y `rootDir` limitados a `public-cloud` | Una mala reconfiguración humana podría ampliar el contexto |
| Clickjacking y MIME sniffing | `frame-ancestors 'none'`, `X-Frame-Options` y `nosniff` | Encabezados no existen al abrir con `file://` |
| Filtración por terceros | Sin fuentes, CDN, analítica ni APIs externas | El host y navegador mantienen sus propios logs |

## Validación JSON

La solicitud acepta exactamente: `uuid`, `nombre`, `correo`, `telefono`, `especialidad`, `medico`, `fecha`, `hora`, `motivo`, `estado`, `consentimiento` y `fechaRegistro`.

La respuesta acepta exactamente: `uuid`, `estado`, `fecha`, `hora` y `fechaActualizacion`.

Se rechazan estructuras con claves sensibles como historia, diagnóstico, tratamiento, receta, resultado, antecedente, observación o documento clínico, incluso si aparecen anidadas.

## Encabezados Nginx

- Content Security Policy sin scripts externos ni ejecución inline.
- Bloqueo de marcos.
- Desactivación de detección MIME.
- Restricción de cámara, micrófono y geolocalización.
- Política de referencia restringida.
- `no-store` para el portal privado y JSON público.

## Brechas deliberadas por alcance

Las contraseñas están visibles, los datos no están cifrados, no existe control en servidor y toda la lógica puede modificarse localmente. Por tanto, el proyecto no debe almacenar información médica o personal real ni exponerse como producto clínico.
