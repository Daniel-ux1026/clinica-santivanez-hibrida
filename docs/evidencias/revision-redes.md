# Revisión de redes y seguridad del laboratorio Azure APF2

Responsable: Fernando - redes y seguridad  
Fecha de revisión documental: 24 de octubre de 2026  
Proyecto: Clínica Santivañez - laboratorio académico con datos sintéticos  
Región: `northcentralus`  
Grupo de recursos: `rg-santivanez-apf2`

## 1. Objetivo y alcance

Revisé la configuración de red y seguridad definida en `infra/azure/main.bicep` y la comparé con `infra/azure/README.md`, `infra/azure/verify-network.sh`, `docs/arquitectura-azure.png` y las evidencias existentes `E-17-azure-infraestructura.json` y `E-21-azure-red.json`.

La revisión es documental: inspección de archivos y comparación con resultados guardados de ejecuciones anteriores. Las evidencias E-17 y E-21 registran verificaciones del 23 de octubre de 2026 (UTC). No inicié sesión en Azure, no ejecuté nuevas pruebas contra las máquinas virtuales y no cambié los recursos del laboratorio. Por eso, los resultados descritos corresponden al estado registrado en esas evidencias, no a una comprobación en tiempo real del 24 de octubre.

## 2. Matriz de controles revisados

| Control | Archivo/regla revisada | Evidencia consultada | Resultado observado | Limitación |
| --- | --- | --- | --- | --- |
| VNet y direccionamiento | `main.bicep`: recurso `vnet`, `addressSpace` | `README.md`; `arquitectura-azure.png`; E-17: `vnet.addressSpace` | Coinciden el nombre `vnet-santivanez-apf2` y el rango `10.60.0.0/16`. En E-17 la VNet figura con estado `Succeeded`. | Estado tomado de E-17; no se consultó Azure nuevamente. |
| Subred pública | `main.bicep`: `vnet.subnets.public` | Diagrama; E-17: `vnet.subnets` | La subred `public` usa `10.60.10.0/24` y tiene asociados `nsg-public-apf2` y `rt-public-apf2`. | Se comprobó por configuración y evidencia anterior, no por consulta nueva. |
| Subred privada | `main.bicep`: `vnet.subnets.private` | Diagrama; E-17: `vnet.subnets` | La subred `private` usa `10.60.20.0/24` y tiene asociados `nsg-private-apf2`, `rt-private-apf2` y `nat-santivanez-apf2`. | La asociación consta en E-17; no se verificó su estado actual. |
| VM web e IP pública | `main.bicep`: `publicNic`, `webIp`, `publicVm` | Diagrama; E-17: `computeInventory`, `publicIps` | `vm-web-apf2` aparece con IP privada `10.60.10.4` e IP pública `20.221.208.49`; coincide con el diagrama. | La IP pública corresponde a la captura de E-17; no se comprobó si sigue vigente. |
| VM privada sin IP pública | `main.bicep`: `privateNic`, `privateVm` | Diagrama; E-17: `computeInventory` | `vm-private-apf2` aparece con `10.60.20.4` y `publicIp: null`. La NIC privada no declara recurso de IP pública. | Se comprobó la ausencia de IP pública directa en la evidencia; no equivale a una auditoría completa de otros posibles accesos. |
| NAT Gateway de salida privada | `main.bicep`: `nat`, `natIp`, asociación de la subred `private` | Diagrama; E-17: `natGateway`, `publicIps`; E-21: `privateNatEgress` | El NAT Gateway Standard está asociado solo a `private`. E-21 registra salida con IP observada `20.102.241.42`, igual a la esperada: `PASS`. | Es una prueba anterior; no demuestra todas las conexiones ni el estado actual del NAT. |
| Tabla de rutas pública | `main.bicep`: `publicRoutes` (`internet-egress`) | E-17: `routeTables`, `effectiveRoutes.public` | Ruta `0.0.0.0/0` con siguiente salto `Internet`; E-17 la muestra como ruta de usuario `Active`. | No se obtuvo una tabla de rutas efectiva nueva. |
| Tabla de rutas privada | `main.bicep`: `privateRoutes` (`explicit-egress-via-nat`) | `README.md`; E-17: `routeTables`, `effectiveRoutes.private`; E-21: `privateNatEgress` | Ruta `0.0.0.0/0` con siguiente salto `Internet`, activa según E-17; el NAT se aplica por asociación a la subred, no como `nextHopType`. | La salida real se respalda solo con la comprobación previa de IP NAT de E-21. |
| Entrada HTTP pública TCP 80 | `main.bicep`: NSG público, regla `web-http-synthetic` (prioridad 100) | Diagrama; E-17: `nsg`, `effectiveNsg.public`; E-21: `externalIngress`, `publicHttpHealth` | Se permite `Internet -> 10.60.10.4:80`. E-21 informa acceso externo a `20.221.208.49:80` con `PASS` y respuesta HTTP 200. | El servicio usa HTTP, sin TLS; solo se contempla información sintética. |
| Acceso web a API privada TCP 3000 | `main.bicep`: reglas `backend-api-only` (salida pública) y `api-from-web-vm-only` (entrada privada), prioridad 100 | Diagrama; `verify-network.sh`; E-17: `effectiveNsg`; E-21: `interVm.checks`, `interVm.apiHealth` | Se permite `10.60.10.4 -> 10.60.20.4:3000`. E-21 registra conexión `PASS` y `/health` con HTTP 200. | Solo está probado ese origen, destino y puerto en la ejecución registrada. |
| Bloqueo de SSH 22, PostgreSQL 5432 y portal 8081 hacia VM privada | `main.bicep`: NSG privado, `deny-other-inbound` (prioridad 4096); sin excepciones para esos puertos | `README.md`; `verify-network.sh`; E-17: `effectiveNsg.private`; E-21: `interVm.checks` | Desde `10.60.10.4` hacia `10.60.20.4`, E-21 marca `PASS` para las tres conexiones bloqueadas (22, 5432 y 8081). El portal 8081 se describe además como limitado a `127.0.0.1`. | Una conexión TCP fallida por sí sola no prueba cuál capa la bloqueó; se contrastó con NSG efectivo de E-17. |
| Puertos no publicados hacia la VM web | `main.bicep`: NSG público, `web-http-synthetic` y `deny-other-inbound` | E-17: `effectiveNsg.public`; E-21: `externalIngress` | Desde un equipo externo a la VNet, E-21 marca `PASS` en el bloqueo de 22, 3000, 5432 y 8081 hacia la IP pública de la VM web `20.221.208.49`. | Estas pruebas apuntan a la IP pública de la VM web, no directamente a la VM privada. |
| Salida controlada y denegación final | `main.bicep`: `updates-and-container-registry`, `nat-updates-and-container-registry`, `deny-other-inbound` y `deny-other-outbound` | `README.md`; E-17: `nsg`, `effectiveNsg.public`, `effectiveNsg.private` | Ambas NSG permiten salida TCP 80/443 hacia `Internet`; la pública permite además TCP 3000 hacia la API privada. Las reglas de denegación están en prioridad 4096, antes de los permisos predeterminados de prioridad 65000 o superior. | No hay en E-21 un barrido exhaustivo de todos los destinos y puertos de salida. Los destinos de Internet 80/443 no están restringidos a una lista específica. |
| DNS de plataforma Azure | `README.md`: explicación del DNS `168.63.129.16`; reglas NSG en `main.bicep` | `README.md`; E-17: `nsg`, `securityNotes` | No aparece una regla de permiso `Allow` con `AzurePlatformDNS`. La documentación del proyecto trata ese DNS como tráfico especial de la plataforma que, de forma predeterminada, no se filtra mediante reglas NSG. | E-21 no contiene una prueba específica de resolución DNS; se revisó la definición y su explicación documental. |
| Resumen de conectividad y salud | `verify-network.sh`: pruebas de 3000, 5432, 8081, 22 y `/health` | E-21: `checksPassed`, `checksFailed`, `interVm`, `publicHttpHealth` | E-21 registra 10 comprobaciones `PASS`, 0 `FAIL`, API privada HTTP 200 y servicio HTTP público 200. | `verify-network.sh` cubre interconexión desde la VM web; las pruebas externas y NAT de E-21 provienen de otras comprobaciones anteriores. No se volvió a ejecutar el script. |

## 3. Diferencias y observaciones

No encontré diferencias de configuración entre los controles indicados en el diagrama, `README.md`, `main.bicep` y los valores registrados en E-17 y E-21. En particular, las direcciones de la VNet, las subredes, las IP de ambas VMs, la asociación de NAT, las rutas y las reglas NSG revisadas son consistentes.

Hay tres puntos importantes para interpretar correctamente las evidencias:

1. La ruta `0.0.0.0/0` de la subred privada indica `nextHopType: Internet`, aunque la salida utiliza NAT Gateway. Esto no es una diferencia: en Azure el NAT Gateway se asocia a la subred; E-21 registra la IP pública de salida esperada. No se debe cambiar el siguiente salto por un supuesto tipo `NatGateway`.
2. E-17 incluye reglas NSG predeterminadas que permiten tráfico de VNet y salida a Internet en prioridades 65000/65001, pero las reglas personalizadas de denegación en prioridad 4096 se evalúan antes. Por eso no contradicen la política restrictiva descrita en el proyecto.
3. Los resultados `PASS` de puertos bloqueados demuestran que las conexiones ensayadas no se establecieron. Su interpretación como control de red se apoya en la lectura conjunta de reglas y rutas efectivas de E-17, no solo en el resultado TCP.

## 4. Limitaciones conocidas y cambios

- La interfaz pública funciona por HTTP (puerto 80), sin HTTPS/TLS. El alcance es académico y usa datos sintéticos; no debe utilizarse con datos de pacientes reales.
- La salida HTTP/HTTPS hacia Internet se permite para instalación de paquetes y registros de contenedores. En un entorno productivo convendría limitar destinos mediante controles adicionales.
- La VPN con la clínica, el TLS integral y la alta disponibilidad figuran como pendientes. Las API y bases de datos están concentradas en la VM privada por el costo del laboratorio.
- E-17 muestra `enableDdosProtection: false`: no consta la habilitación de la opción específica de protección DDoS en esta VNet. No se evaluó una protección adicional contra DDoS en esta revisión.
- No se modificó `main.bicep`, el diagrama ni las reglas NSG porque no se halló una diferencia verificada que justificara cambiar la configuración del laboratorio. Cualquier ajuste requiere evaluación y autorización del equipo.

## 5. Conclusión

De acuerdo con los archivos revisados y las evidencias registradas el 23 de octubre de 2026, la segmentación de red, el acceso público TCP 80, la comunicación controlada hacia la API TCP 3000, el bloqueo de puertos internos, las rutas y la salida NAT coinciden con la arquitectura prevista para el laboratorio APF2. E-21 registra 10 comprobaciones satisfactorias y ninguna fallida. Esta conclusión es una revisión documental y no certifica el estado en vivo de Azure el 24 de octubre de 2026.

## 6. Fuentes consultadas

- `infra/azure/README.md` (topología, decisiones, operación y limitaciones).
- `infra/azure/main.bicep` (declaración de VNet, NIC, NAT, NSG, rutas y VMs).
- `infra/azure/verify-network.sh` (definición de pruebas inter-VM y salud de API).
- `docs/arquitectura-azure.png` (diagrama de la arquitectura de red, fechado 23/10/2026).
- `docs/evidencias/E-17-azure-infraestructura.json` (recursos desplegados, NSG y rutas efectivos, verificación del 23/10/2026).
- `docs/evidencias/E-21-azure-red.json` (conectividad inter-VM, acceso externo, NAT y salud HTTP; verificación del 23/10/2026).
