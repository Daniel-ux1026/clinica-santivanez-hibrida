#!/usr/bin/env bash
# Azure Custom Script Extension ejecuta main con configuración en protectedSettings.
# No usar set -x ni imprimir el JSON o .env.
set -euo pipefail
umask 077

main() {
  config_path=$(mktemp /root/apf2-config.XXXXXX)
  trap 'rm -f "$config_path"' EXIT
  printf '%s' "$1" | base64 -d > "$config_path"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get -o DPkg::Lock::Timeout=300 install -y -qq docker.io docker-compose-v2 git curl ca-certificates python3
  systemctl enable --now docker
  role=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["role"])' "$config_path")
  commit=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["sourceCommit"])' "$config_path")
  [[ "$commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'SHA de fuente inválido'; exit 1; }
  if [[ "$role" == 'private' ]]; then
    disk=/dev/disk/azure/scsi1/lun0
    for _ in $(seq 1 60); do [[ -b "$disk" ]] && break; sleep 2; done
    [[ -b "$disk" ]] || { echo 'No se encontró el disco de datos LUN0'; exit 1; }
    fs_type=$(blkid -s TYPE -o value "$disk" || true)
    if [[ -z "$fs_type" ]]; then
      # Solo el disco de datos nuevo y sin firmas. Nunca el disco del sistema.
      [[ -z "$(lsblk -n -o FSTYPE "$disk" | tr -d '[:space:]')" ]] || exit 1
      [[ $(lsblk -n -o TYPE "$disk" | wc -l) -eq 1 ]] || { echo 'Disco con particiones no esperado'; exit 1; }
      mkfs.ext4 -q "$disk"
    elif [[ "$fs_type" != 'ext4' ]]; then
      echo 'Se rechaza formatear un sistema de archivos existente no esperado'; exit 1
    fi
    mkdir -p /srv/santivanez
    uuid=$(blkid -s UUID -o value "$disk")
    grep -q "UUID=$uuid " /etc/fstab || printf 'UUID=%s /srv/santivanez ext4 defaults,nofail 0 2\n' "$uuid" >> /etc/fstab
    mountpoint -q /srv/santivanez || mount /srv/santivanez
    mkdir -p /srv/santivanez/public-data /srv/santivanez/clinical-data
    mkdir -p /etc/systemd/system/docker.service.d
    printf '[Unit]\nRequiresMountsFor=/srv/santivanez\n' > /etc/systemd/system/docker.service.d/apf2-data.conf
    systemctl daemon-reload
  elif [[ "$role" != 'public' ]]; then
    echo 'Rol inválido'; exit 1
  fi
  # El código público debe poder leerse por PostgreSQL y Nginx sin root.
  # El JSON protegido y .env conservan permisos privados.
  umask 022
  if [[ ! -d /opt/santivanez/.git ]]; then
    git clone --quiet --branch Dev https://github.com/Daniel-ux1026/clinica-santivanez-hibrida.git /opt/santivanez
  fi
  cd /opt/santivanez
  git fetch --quiet origin Dev
  git checkout --quiet --detach "$commit"
  git ls-files -z | xargs -0 chmod a+r
  find app docker infra -type d -exec chmod 755 {} +
  chmod 755 /opt/santivanez
  umask 077
  python3 - "$config_path" <<'PY'
import json, pathlib, re, sys
c=json.load(open(sys.argv[1]))
env=c['env'] | {'PUBLIC_ORIGIN':c['publicOrigin'],'PRIVATE_BIND_IP':c['privateAddress']}
for k,v in env.items():
    if not re.fullmatch(r'[A-Z_]+',k) or '\n' in v or '\r' in v:
        raise SystemExit('Configuración inválida')
p=pathlib.Path('.env');p.write_text(''.join(f'{k}={v}\n' for k,v in env.items()));p.chmod(0o600)
PY
  docker compose --env-file .env -f "infra/azure/compose.$role.yaml" config --quiet
  if [[ "$role" == 'private' ]]; then
    docker compose --env-file .env -f infra/azure/compose.private.yaml up -d --wait --wait-timeout 120 public-db clinical-db
    # Repara únicamente una inicialización interrumpida que dejó la BD sin rol.
    # No borra datos ni cambia contraseñas de un rol existente.
    for service in public-db clinical-db; do
      docker compose --env-file .env -f infra/azure/compose.private.yaml exec -T "$service" sh -c '
        exists=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT count(*) FROM pg_roles WHERE rolname = '\''clinic_app'\''")
        if [ "$exists" = 0 ]; then sh /docker-entrypoint-initdb.d/01-app.sh; fi'
    done
  fi
  docker compose --env-file .env -f "infra/azure/compose.$role.yaml" up -d --build --wait --wait-timeout 300
  printf 'APF2 role=%s source=%s: contenedores iniciados y saludables\n' "$role" "$commit"
}
