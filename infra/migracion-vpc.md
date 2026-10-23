# Traslado propuesto desde el laboratorio a una red cloud

Estado: **SIMULADO como diseño, no aprovisionado**. Este documento satisface la explicación del equivalente VPC/VNet solicitada para un laboratorio local. No cambia la elección vigente de Render ni crea recursos facturables.

Una VPC es una red virtual aislada en un proveedor. Una subred divide sus direcciones; una tabla de rutas indica el destino del tráfico. Un Security Group limita conexiones por puerto y origen. Docker Compose permite separar puentes, pero no implementa esos recursos cloud.

| Elemento propuesto | Dirección o regla | Propósito |
|---|---|---|
| VPC de ejemplo | 10.60.0.0/16 | Espacio cloud distinto de la red clínica y del laboratorio |
| Subred pública | 10.60.10.0/24 | Punto de entrada HTTPS y NAT, cuando corresponda |
| Subred privada de aplicación | 10.60.20.0/24 | Servicio público de citas sin IP pública directa |
| Subred privada de datos | 10.60.30.0/24 | PostgreSQL de citas, sin IP pública |
| Internet Gateway | Ruta 0.0.0.0/0 de subred pública | Entrada/salida para recursos públicos |
| NAT Gateway | Ruta 0.0.0.0/0 de aplicación hacia NAT | Salida de actualización; no entrada directa |
| Tabla de datos | Ruta local; sin ruta Internet por defecto | Comunicación interna con aplicación |
| SG de entrada | Internet → balanceador:443 | HTTPS del portal de citas |
| SG de aplicación | SG de entrada → API:3000 | Tráfico del proxy/balanceador |
| SG de datos | SG de aplicación → PostgreSQL:5432 | Acceso a datos mínimos |
| Acceso administrativo | Red de gestión/VPN; sin SSH abierto a Internet | Operación autorizada |

La clínica conserva su segmento privado, con API y base clínica accesibles solo desde la red del personal/VPN. Su agente inicia HTTPS:443 hacia la API pública autenticada. No se publica PostgreSQL clínico. Antes de implementar se verifican rangos para evitar solapamiento y se evalúan VPN, identidad, región, disponibilidad y costos. No se conectan sin más las cinco redes Docker a una VPC.

En Render, el punto de entrada TLS y la red del proveedor son administrados. `render.yaml` prepara la aplicación y su base en la misma región, pero no permite afirmar que se crearon estas subredes, tablas, NAT o SG. Para demostrar recursos VPC configurables habría que elegir posteriormente una plataforma IaaS apropiada o una integración adicional justificada. Un servidor físico de la clínica es entorno privado local; no demuestra por sí solo una nube privada según NIST.

Referencias oficiales consultadas el 22/10/2026: [redes de Render](https://render.com/docs/private-network), [puentes Docker](https://docs.docker.com/engine/network/drivers/bridge/), [definición de nube de NIST](https://csrc.nist.gov/pubs/sp/800/145/final).
