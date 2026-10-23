# Laboratorio Azure del APF2

Este directorio agrega infraestructura real al laboratorio Docker local. Usa exclusivamente datos sintéticos. El estado de implementación y las pruebas se registran en las evidencias; disponer del manifiesto por sí solo no acredita un despliegue correcto.

## Topología y decisiones

- VNet `10.60.0.0/16`; subred `public` `10.60.10.0/24` y subred `private` `10.60.20.0/24`.
- VM web `10.60.10.4`, IP pública Standard y solo TCP 80 entrante. La página pública usa HTTP para la demostración académica; no ingresar datos reales. TLS es un pendiente para uso productivo.
- VM privada `10.60.20.4`, sin IP pública: API pública, API de personal, portal de personal, dos PostgreSQL y agente de integración. El portal de personal escucha únicamente en `127.0.0.1:8081` de esa VM. La administración usa Azure Run Command; SSH 22 está bloqueado.
- Dos tablas de rutas asociadas a las subredes. `0.0.0.0/0 → Internet`; la subred privada tiene NAT Gateway Standard e IP de salida explícita. En Azure el siguiente salto Internet cumple la salida hacia Internet; no hay un recurso llamado AWS Internet Gateway. NAT es una asociación de subred, no un tipo de siguiente salto.
- Dos NSG con denegación explícita del resto del tráfico en prioridad 4096, incluida la comunicación VNet predeterminada. Solo la VM web puede llamar a `10.60.20.4:3000`. No hay reglas entrantes para 5432, 8081 o 22. Las respuestas a conexiones permitidas son stateful.
- Salida de aplicación permitida: HTTP/HTTPS para paquetes y registros de contenedores, y web → API privada 3000. Las pruebas del cliente público desde la VM privada usan el FQDN público a través de NAT, como un usuario externo; el acceso HTTP directo a la IP privada de la VM web no está autorizado. El resto se deniega. El DNS proporcionado por Azure (`168.63.129.16`) es tráfico de plataforma que no está sujeto a NSG de forma predeterminada; no se usa una regla Allow con `AzurePlatformDNS`, etiqueta que Azure permite dirigir mediante una regla Deny. HTTP/HTTPS a Internet es necesario durante aprovisionamiento; para producción conviene restringir destinos mediante un proxy/firewall.
- Un disco administrado de datos de 32 GiB, separado del SO, montado en `/srv/santivanez`. Las dos bases usan directorios distintos sobre ese disco. La dependencia systemd impide iniciar Docker sin el montaje. Los datos de PostgreSQL no dependen del ciclo de vida del contenedor.
- Las dos bases y API comparten VM por costo del laboratorio. Las redes internas de Docker mantienen la separación de servicios; esta concentración reduce alta disponibilidad y no sustituye un entorno clínico real ni una conexión VPN con la clínica.

## Reproducir

Requisitos: Azure CLI oficial, Bicep, Node.js 22+, OpenSSH (`ssh-keygen`), rol suficiente y créditos disponibles. Consultar políticas de regiones, cuotas y disponibilidad antes de elegir tamaños. No elevar a pago por uso ni cambiar políticas de la universidad.

1. Autenticar con `az login`, seleccionar la suscripción correcta y consultar `az account show`. Mantener su caché de autenticación fuera del repositorio.
2. Consultar `az vm list-usage --location REGION` y `az vm list-skus --location REGION --size Standard_B --all`. Elegir dos tamaños pequeños x64 dentro de la cuota; el privado necesita al menos 4 GiB de RAM.
3. Revisar y publicar el código técnico aprobado en `Dev`. Generar parámetros para el SHA completo revisado:

```powershell
node scripts/setup-azure.mjs --commit=SHA_COMPLETO_DE_40_CARACTERES --public-vm-size=Standard_B2ats_v2 --private-vm-size=Standard_B2als_v2
az bicep build --file infra/azure/main.bicep --outfile tmp/azure/main.json
az group create --name rg-santivanez-apf2 --location REGION
az deployment group validate --resource-group rg-santivanez-apf2 --template-file tmp/azure/main.json --parameters @config/azure-local.parameters.json
az deployment group what-if --resource-group rg-santivanez-apf2 --template-file tmp/azure/main.json --parameters @config/azure-local.parameters.json
```

El `@archivo` es un argumento literal de Azure CLI; en PowerShell puede ser necesario escribirlo entre comillas simples (`'@config/azure-local.parameters.json'`). No copiar la configuración expandida, contraseñas o el archivo de parámetros a evidencias.

4. Comprobar el plan y los precios vigentes antes de ejecutar:

```powershell
az deployment group create --name apf2-lab --resource-group rg-santivanez-apf2 --template-file tmp/azure/main.json --parameters '@config/azure-local.parameters.json' --query properties.provisioningState
az deployment group show -g rg-santivanez-apf2 -n apf2-lab --query properties.outputs
az vm list -g rg-santivanez-apf2 -d --output table
```

Las extensiones oficiales Custom Script descargan el SHA fijado desde el repositorio público, instalan Docker y ejecutan Compose. Los secretos entran como parámetros ARM `secureString` y `protectedSettings` de la extensión. Se guardan en `.env` local con permisos 0600 dentro de la VM; no en outputs de ARM ni en Git. No imprimir `docker compose config` expandido.

## Verificación y operación

Comprobar salud HTTP, ambos inventarios de contenedores, NAT de salida, rutas y NSG efectivos, accesos permitidos y bloqueados, y persistencia/restauración en el disco de datos. Ejecutar operaciones del personal y pruebas desde Azure Run Command en la VM privada. Un recurso creado sin una prueba del flujo no demuestra que el sistema esté operativo.

```powershell
az vm run-command invoke -g rg-santivanez-apf2 -n vm-private-apf2 --command-id RunShellScript --scripts 'cd /opt/santivanez; docker compose --env-file .env -f infra/azure/compose.private.yaml ps'
az network nic list-effective-nsg -g rg-santivanez-apf2 -n nic-private-apf2
az network nic show-effective-route-table -g rg-santivanez-apf2 -n nic-private-apf2
```

Las VMs tienen apagado diario a las **03:00 de Lima**. Antes de una demostración se pueden iniciar con `az vm start`. Para detener el cómputo usar `az vm deallocate` en ambas VMs; apagar el sistema invitado no basta para dejar de cobrar cómputo.

```powershell
az vm start -g rg-santivanez-apf2 -n vm-private-apf2
az vm start -g rg-santivanez-apf2 -n vm-web-apf2
az vm run-command invoke -g rg-santivanez-apf2 -n vm-private-apf2 --command-id RunShellScript --scripts '@infra/azure/verify-private.sh'
az vm run-command invoke -g rg-santivanez-apf2 -n vm-web-apf2 --command-id RunShellScript --scripts '@infra/azure/verify-network.sh'
```

`verify-private.sh` usa el FQDN público por NAT y el portal de personal en loopback. Instala el runner Node 22 desde el sitio oficial después de comprobar SHA-256, adapta solo las direcciones/rutas de evidencia de la suite existente y ejecuta las mismas 24 comprobaciones. La restauración usa bases temporales independientes. `verify-network.sh` comprueba API permitida y puertos privados bloqueados desde la VM web. Las evidencias originales locales no se sobrescriben.

**NAT, IP públicas y discos siguen cobrando aunque las VMs estén desasignadas.** Revisar Azure Cost Management y créditos. El grupo es exclusivo del laboratorio; al terminar y después de conservar evidencias/respaldos necesarios, su eliminación detiene los cargos de sus recursos. No ejecutar una eliminación contra un grupo ajeno ni sin revisar el nombre y los datos que contiene.

## Fuentes oficiales

- [NAT y tablas de rutas](https://learn.microsoft.com/en-us/azure/nat-gateway/nat-gateway-design)
- [Salida explícita de subredes](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access)
- [NSG y reglas](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview)
- [Custom Script y protectedSettings](https://learn.microsoft.com/en-us/azure/virtual-machines/extensions/custom-script-linux)
- [Tráfico de plataforma y Azure DNS](https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16)
- [Precios públicos de Azure](https://prices.azure.com/api/retail/prices)
