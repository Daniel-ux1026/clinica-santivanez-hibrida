from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs';OUT.mkdir(exist_ok=True)
im=Image.new('RGB',(2400,1580),'white');d=ImageDraw.Draw(im)
green='#22654b';blue='#315f88';orange='#9c601c';ink='#173d35';gray='#53656a'
def font(n,bold=False):return ImageFont.truetype('C:/Windows/Fonts/'+('arialbd.ttf' if bold else 'arial.ttf'),n)
def text(x,y,s,n=26,c=ink,bold=False):d.multiline_text((x,y),s,font=font(n,bold),fill=c,spacing=10)
def box(x,y,w,h,title,body,c=blue,fill='white'):
 d.rounded_rectangle((x,y,x+w,y+h),18,fill=fill,outline=c,width=3)
 text(x+22,y+18,title,29,c,True);text(x+22,y+67,body,25,gray)
def arrow(points,c=orange):
 d.line(points,fill=c,width=5,joint='curve');x,y=points[-1];a=math.atan2(y-points[-2][1],x-points[-2][0])
 d.polygon([(x,y),(x-20*math.cos(a-.45),y-20*math.sin(a-.45)),(x-20*math.cos(a+.45),y-20*math.sin(a+.45))],fill=c)
text(65,40,'Arquitectura y red del laboratorio Azure APF2',48,ink,True)
text(65,112,'Clínica Santivañez  |  North Central US  |  Datos sintéticos  |  23 de octubre de 2026',27,gray)
d.rounded_rectangle((660,210,2340,1315),24,fill='#f5f8fa',outline=blue,width=3)
text(695,233,'VNet 10.60.0.0/16   ·   vnet-santivanez-apf2',32,blue,True)
box(50,365,520,185,'Navegador de prueba','HTTP público TCP 80\nSin información de pacientes reales',green,'#f3f8ef')
text(65,655,'Administración por Azure\nRun Command y control de acceso.\nSin SSH entrante.',25,gray)
box(705,320,620,720,'Subred public · 10.60.10.0/24','NSG: Internet → web:80 únicamente\nResto de entradas denegadas',green,'#f0f6ec')
box(755,490,520,220,'vm-web-apf2 · 10.60.10.4','B2ats_v2 · 2 vCPU · 1 GiB\nUbuntu 24.04 · Docker\npublic-web (Nginx) :80 → :8080',green)
text(755,758,'IP pública: 20.221.208.49\nrt-public: 0.0.0.0/0 → Internet\nSalida privada: solo API TCP 3000\nActualizaciones: Internet 80/443',25,gray)
box(1450,320,840,720,'Subred private · 10.60.20.0/24','NSG: web 10.60.10.4 → API:3000\nResto de entradas denegadas; sin IP pública',blue,'#eff4f8')
box(1500,490,740,345,'vm-private-apf2 · 10.60.20.4','B2als_v2 · 2 vCPU · 4 GiB · Ubuntu 24.04\npublic-api :3000 (solo desde VM web)\nprivate-web 127.0.0.1:8081 → private-api\npublic-db + clinical-db :5432 internos\nsync-agent: reservas y estados, sin historias',blue)
text(1500,872,'rt-private: 0.0.0.0/0 → Internet\nNAT asociado: salida explícita; sin entrada nueva\nPuentes Docker internos separan datos e integración',25,gray)
arrow([(570,455),(755,455),(755,540)],green)
text(570,370,'TCP 80',22,green,True)
arrow([(1275,610),(1500,610)],green)
text(1350,555,'3000',23,green,True)
box(710,1120,615,135,'NAT Gateway Standard','IP de salida: 20.102.241.42\nAsociado únicamente a la subred privada',orange,'#fff7eb')
arrow([(1600,1040),(1600,1080),(1040,1080),(1040,1120)],orange)
arrow([(710,1190),(425,1190),(425,1080)],orange)
text(65,955,'Internet de salida\nHTTPS/HTTP para actualizaciones\ny registros de contenedores',25,orange)
box(1450,1120,840,135,'Disco de datos administrado · 32 GiB','/srv/santivanez → public-data y clinical-data\nSeparado de los discos SO; requiere montaje antes de Docker',gray,'#f3f4f5')
arrow([(1930,1040),(1930,1120)],gray)
text(65,1360,'Leyenda  Verde: entrada y flujo API   Azul: entorno privado   Naranja: salida NAT   Gris: almacenamiento',27,ink,True)
text(65,1410,'Las flechas muestran quién inicia la conexión; las respuestas usan el mismo canal. 22, 5432 y 8081 no se abren a Internet.',25,gray)
text(65,1453,'Azure DNS es tráfico de plataforma. Azure usa el siguiente salto Internet; no existe un recurso AWS Internet Gateway en esta VNet.',25,gray)
text(65,1496,'Alcance académico: backend concentrado en una VM, HTTP de demostración y datos ficticios. VPN clínica, TLS integral y HA pendientes.',25,gray)
im.save(OUT/'arquitectura-azure.png')
print(OUT/'arquitectura-azure.png')
