from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs';OUT.mkdir(exist_ok=True)
W,H=2400,1440
INK='#173d35';MUTED='#5f716c';GREEN='#22654b';BLUE='#315f88';ORANGE='#a76a20'
def font(n,bold=False):return ImageFont.truetype('C:/Windows/Fonts/'+('arialbd.ttf' if bold else 'arial.ttf'),n)
def text(d,xy,lines,size=27,fill=INK,bold=False,spacing=12,anchor='la'):
    d.multiline_text(xy,lines,font=font(size,bold),fill=fill,spacing=spacing,anchor=anchor)
def box(d,bounds,title,body,color=GREEN,fill='#ffffff'):
    d.rounded_rectangle(bounds,radius=20,fill=fill,outline=color,width=3)
    x,y,x2,y2=bounds
    text(d,(x+27,y+25),title,30,color,True)
    text(d,(x+27,y+76),body,25,MUTED,spacing=10)
def arrow(d,points,color=GREEN,width=5):
    d.line(points,fill=color,width=width,joint='curve')
    x,y=points[-1];x0,y0=points[-2];a=math.atan2(y-y0,x-x0)
    d.polygon([(x,y),(x-18*math.cos(a-.45),y-18*math.sin(a-.45)),(x-18*math.cos(a+.45),y-18*math.sin(a+.45))],fill=color)
def canvas(title,subtitle):
    im=Image.new('RGB',(W,H),'#ffffff');d=ImageDraw.Draw(im)
    text(d,(75,55),title,49,INK,True);text(d,(75,125),subtitle,26,MUTED)
    d.line([(75,185),(2325,185)],fill='#dce4de',width=2)
    return im,d
im,d=canvas('Arquitectura implementada del laboratorio APF2','Clínica Santivañez | Docker Desktop local | Datos sintéticos | Actualizado el 22 de octubre de 2026')
d.rounded_rectangle((65,310,880,1180),25,fill='#f0f6ec',outline='#a9c7ab',width=2)
d.rounded_rectangle((1515,310,2335,1180),25,fill='#eff4f8',outline='#acc3d5',width=2)
text(d,(100,340),'ENTORNO PÚBLICO REPRESENTADO LOCALMENTE',24,GREEN,True)
text(d,(1550,340),'ENTORNO PRIVADO DEL LABORATORIO',24,BLUE,True)
box(d,(180,215,760,285),'Paciente de prueba','',GREEN,'#f7faf4')
box(d,(1635,215,2215,285),'Personal autorizado','',BLUE,'#f7f9fb')
box(d,(180,450,760,600),'C-01  public-web','Nginx sin privilegios\nHTML, CSS y JavaScript | localhost:8080')
box(d,(180,740,760,905),'C-02  public-api','Node.js y Express | puerto 3000\nValida, reserva y autoriza consultas')
box(d,(180,1020,760,1170),'C-03  public-db','PostgreSQL 17 | citas mínimas\nVolumen public-data | sin puerto host')
box(d,(1635,450,2215,600),'C-04  private-web','Nginx sin privilegios\nPortal de personal | localhost:8081',BLUE)
box(d,(1635,740,2215,905),'C-05  private-api','Sesiones y permisos en servidor\nRecepción, médico y administración',BLUE)
box(d,(1635,1020,2215,1170),'C-06  clinical-db','PostgreSQL 17 | registros sintéticos\nVolumen clinical-data | sin puerto host',BLUE)
box(d,(955,740,1445,920),'C-07  sync-agent','Conexión iniciada por el agente\nSondeo cada 3 segundos\nCola, versiones e idempotencia',ORANGE,'#fff8ed')
for x,c in [(470,GREEN),(1925,BLUE)]:
    side=850 if x==470 else 2295
    arrow(d,[(x,285),(x,300),(side,300),(side,420),(x,420),(x,450)],c)
    text(d,(x+20,385),'HTTP local',24,MUTED)
    arrow(d,[(x,600),(x,740)],c)
    text(d,(x+20,645),'/api',24,MUTED)
    arrow(d,[(x,905),(x,1020)],c)
    text(d,(x+20,950),'SQL 5432',24,MUTED)
arrow(d,[(955,800),(760,800)],ORANGE)
text(d,(915,610),'Intercambio mínimo autenticado\nReservas y estados\nSin historias ni diagnósticos',24,ORANGE)
arrow(d,[(1200,920),(1200,1085),(1635,1085)],ORANGE)
text(d,(1070,1125),'Copia y cola privadas',23,ORANGE)
text(d,(75,1235),'Leyenda  Verde: citas públicas   Azul: gestión privada   Naranja: integración iniciada desde el agente',26,INK,True)
text(d,(75,1285),'Las flechas indican quién inicia la conexión. La respuesta utiliza el mismo canal. HTTP solo dentro del laboratorio local.',25,MUTED)
text(d,(75,1332),'Destino previsto: Render para la capa pública y servidor clínico privado. HTTPS, VPN/MFA y controles productivos pendientes.',25,MUTED)
im.save(OUT/'arquitectura.png')

im,d=canvas('Topología de las redes Docker y límites de acceso','Cinco puentes independientes | CIDR explícitos | Matriz de pertenencia de los siete servicios')
names=['public-web','public-api','public-db','sync-agent','clinical-db','private-api','private-web']
xs=[690+i*250 for i in range(7)]
for x,n in zip(xs,names):
    d.rounded_rectangle((x-110,230,x+110,320),12,fill='#f3f6f0',outline='#cfdbd1',width=2)
    text(d,(x,267),n,25,INK,True,anchor='mm')
rows=[('edge','10.42.10.0/24','Puente con NAT de Docker',[0,1],GREEN),
      ('public-data','10.42.20.0/24','Interna sin salida por gateway',[1,2],GREEN),
      ('integration','10.42.30.0/24','Interna sin salida por gateway',[1,3],ORANGE),
      ('clinical-data','10.42.40.0/24','Interna sin salida por gateway',[3,4,5],BLUE),
      ('staff','10.42.50.0/24','Puente con NAT de Docker',[5,6],BLUE)]
for i,(name,cidr,kind,indices,c) in enumerate(rows):
    y=405+i*145
    if i%2==0:d.rectangle((70,y-45,2325,y+90),fill='#f7f9f5')
    text(d,(90,y-30),name,29,c,True);text(d,(90,y+12),cidr,26,INK);text(d,(315,y+12),kind,20,MUTED)
    for x in xs:d.ellipse((x-5,y+19,x+5,y+29),fill='#d6dfd7')
    d.line([(xs[min(indices)],y+24),(xs[max(indices)],y+24)],fill=c,width=6)
    for j in indices:d.ellipse((xs[j]-15,y+9,xs[j]+15,y+39),fill=c,outline='white',width=3)
text(d,(75,1180),'Publicación en el host',31,INK,True)
text(d,(75,1230),'127.0.0.1:8080 → public-web:8080       127.0.0.1:8081 → private-web:8080',28,GREEN,True)
text(d,(75,1282),'API: 3000 solo entre servicios. PostgreSQL: 5432 solo en su red. Sin publicación de bases ni API en el host.',25,MUTED)
text(d,(75,1330),'Aislamiento verificado por DNS y TCP desde la API pública hacia clinical-db. No equivale a una VPC/VNet ni a un Security Group.',25,MUTED)
im.save(OUT/'topologia-red.png')
print('Diagramas generados en docs/')
