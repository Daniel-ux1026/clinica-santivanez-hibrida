# Despliegue local

## Requisitos

- Docker Desktop o Docker Engine con el complemento Compose.
- Puertos 8080 y 8081 disponibles.

## Ejecución

```bash
docker compose up --build
```

Comprobación:

```bash
docker compose ps
docker compose logs --tail=100 public-cloud
docker compose logs --tail=100 private-cloud
```

Direcciones:

- Público: `http://localhost:8080`
- Privado: `http://localhost:8081`
- Health checks: `http://localhost:8080/health` y `http://localhost:8081/health`

## Ciclo de cambios

```bash
docker compose down
docker compose up --build --force-recreate
```

`docker compose down` no borra LocalStorage, porque ese almacenamiento pertenece al navegador. Para restaurar los datos privados use la acción administrativa “Reiniciar datos demo” o limpie el almacenamiento del sitio desde el navegador.

## Aislamiento

La imagen pública se construye con contexto `./public-cloud`. La imagen privada se construye con contexto `./private-cloud`. Ninguna instrucción `COPY` puede atravesar su contexto asignado.
