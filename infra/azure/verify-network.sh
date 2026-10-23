#!/usr/bin/env bash
# Azure Run Command en vm-web-apf2. Solo destinos del laboratorio.
set -euo pipefail
test "$(hostname)" = vm-web-apf2
mkdir -p /opt/santivanez/tmp
python3 - <<'PY'
import datetime,json,pathlib,socket,urllib.request
results=[]
for port,expected in [(3000,True),(5432,False),(8081,False),(22,False)]:
    try:
        with socket.create_connection(('10.60.20.4',port),timeout=4): actual=True
    except OSError: actual=False
    results.append({'source':'10.60.10.4','destination':'10.60.20.4','port':port,'expectedAllowed':expected,'connected':actual,'result':'PASS' if actual==expected else 'FAIL'})
with urllib.request.urlopen('http://10.60.20.4:3000/health',timeout=8) as r:
    health={'httpStatus':r.status,'body':json.load(r)}
assert all(x['result']=='PASS' for x in results) and health['httpStatus']==200
d={'executedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Conectividad entre VMs Azure; se contrasta con NSG y rutas efectivas','checks':results,'apiHealth':health}
pathlib.Path('/opt/santivanez/tmp/azure-network-web.json').write_text(json.dumps(d,indent=2))
print(json.dumps(d))
PY
