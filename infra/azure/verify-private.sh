#!/usr/bin/env bash
# Ejecutar mediante Azure Run Command únicamente en vm-private-apf2.
set -euo pipefail
umask 077
cd /opt/santivanez
test "$(hostname)" = vm-private-apf2
mountpoint -q /srv/santivanez

# Node 22 oficial para el runner del host. Los servicios ya usan Node 22 en Docker.
if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" != 22 ]]; then
  work=$(mktemp -d /root/apf2-node.XXXXXX)
  trap 'rm -rf "$work"' EXIT
  curl --fail --silent --show-error https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o "$work/SHASUMS256.txt"
  archive=$(awk '$2 ~ /^node-v22\.[0-9]+\.[0-9]+-linux-x64.tar.xz$/ {print $2}' "$work/SHASUMS256.txt")
  [[ "$archive" =~ ^node-v22\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz$ ]]
  curl --fail --silent --show-error "https://nodejs.org/dist/latest-v22.x/$archive" -o "$work/$archive"
  (cd "$work"; grep " $archive$" SHASUMS256.txt | sha256sum --check --status)
  mkdir -p /opt/node22
  tar -xJf "$work/$archive" --strip-components=1 -C /opt/node22
  ln -sf /opt/node22/bin/node /usr/local/bin/node
fi
mkdir -p tmp
python3 - <<'PY'
from pathlib import Path
p=Path('tests/integration.test.js').read_text()
changes={"const pub='http://localhost:8080'":"const pub='http://10.60.10.4'",
 'docs/evidencias/E-04-pruebas.json':'docs/evidencias/E-18-azure-pruebas.json',
 'Docker Desktop local, datos sintéticos':'Azure VM privada hacia VM web; datos sintéticos; mismo conjunto de 24 comprobaciones'}
for before,after in changes.items():
    if p.count(before)!=1:raise SystemExit('Runner cambió: revisar adaptación antes de continuar')
    p=p.replace(before,after)
Path('tmp/azure-integration.test.js').write_text(p)
p=Path('scripts/verify-backup.mjs').read_text().replace('E-03-restauracion.json','E-19-azure-restauracion.json')
Path('tmp/verify-backup-azure.mjs').write_text(p)
PY
set -a
. ./.env
set +a
export COMPOSE_FILE=infra/azure/compose.private.yaml
node --test tmp/azure-integration.test.js > tmp/azure-integration.log 2>&1 || { tail -n 25 tmp/azure-integration.log; exit 1; }
node tmp/verify-backup-azure.mjs > tmp/azure-backup.log 2>&1 || { echo 'Falló la restauración; revisar log local sin publicar secretos'; exit 1; }
python3 - <<'PY'
import json
from pathlib import Path
a=json.loads(Path('docs/evidencias/E-18-azure-pruebas.json').read_text())
b=json.loads(Path('docs/evidencias/E-19-azure-restauracion.json').read_text())
assert a['total']==24 and a['passed']==24 and a['failed']==0
assert len(b['results'])==2 and all(x['result']=='PASS' for x in b['results'])
print(json.dumps({'functional':{'total':a['total'],'passed':a['passed'],'failed':a['failed'],'executedAt':a['executedAt']},'restore':[{'service':r['service'],'result':r['result'],'rows':r['rows']} for r in b['results']]}))
PY
