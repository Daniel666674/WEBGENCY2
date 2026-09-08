---
name: crear-demo
description: >
  Genera y publica un sitio de demostracion web real, de varias paginas, para un negocio
  pequeno (panaderia, taller, spa, tienda, restaurante, cualquier PYME), y entrega un link
  de GitHub Pages listo para compartir con el cliente. Usa esta skill SIEMPRE que el
  usuario pida crear, armar, generar o hacer un demo, sitio, pagina web o landing para un
  negocio, cliente o prospecto especifico — incluso si no menciona esta skill por nombre,
  por ejemplo "hazme un demo para una panaderia que se llama X", "necesito un sitio para
  mostrarle a un cliente nuevo", "armame una web de prueba para tal negocio", o el comando
  /crear-demo. Tambien se activa si el usuario pide revisar o procesar solicitudes
  pendientes de demos guardadas en el formulario "Nuevo Demo" de webgency2.
---

# Crear Demo Web

Generas un sitio de demostracion real para un negocio pequeno — varias paginas HTML
estaticas, navegacion que funciona entre ellas, contenido escrito para ese negocio
especifico — y lo publicas en GitHub Pages. El resultado se guarda en el repositorio
`Daniel666674/webgency2`, en `docs/<slug>/`, sin crear repos nuevos ni tocar la app del
CRM que vive en ese mismo repositorio.

**No es un generador de landing pages de IA.** Nada de hero-con-3-iconos, nada de blobs
degradados, nada de "Descubre tu potencial". Tiene que leerse como un sitio real que hizo
una agencia para un cliente real — variá la paleta, la tipografia y el layout de un demo a
otro; dos negocios de rubros distintos nunca deberian verse como la misma plantilla
reciclada.

## Paso 0 — Acceso al repositorio

Antes de escribir nada, aseguraté de tener el repo:

```
add_repo(owner="Daniel666674", repo="webgency2", access="push")
```

Si ya esta clonado en este entorno, corré `git pull origin main` en vez de clonar de
nuevo. Si `add_repo` no esta disponible o falla en esta sesion (pasa en corridas
automaticas sin conexion de GitHub), no hay forma de completar el pedido — decilo
explicitamente en vez de improvisar, y si venís de procesar una solicitud del formulario
"Nuevo Demo" (ver Paso 6), marcala como error con ese motivo.

## Paso 1 — Reunir la informacion del negocio

Si el usuario ya te dio los datos en su pedido (por texto, o porque estas procesando una
solicitud guardada, ver Paso 6), no vuelvas a preguntar — usalos directamente. Si no,
pedí de forma conversacional, en un solo mensaje si es posible:

- Nombre del negocio (lo unico obligatorio)
- Rubro / a que se dedican
- Objetivo del sitio: que llamen/escriban (leads), que compren (sales), que reserven
  (bookings), o solo generar confianza (credibility)
- Publico al que le habla
- Diferenciador real (por que lo eligen a el y no a la competencia)
- Tono: cercano, profesional, premium o atrevido
- Colores de marca (o que vos elijas segun el rubro)
- Servicios o productos
- Contacto: telefono/WhatsApp, email, direccion, Instagram/Facebook — solo lo que
  realmente tengan
- Testimonios reales (si no tienen, esa seccion no se crea — nunca inventes clientes)

Todo lo que quede vacio significa que esa seccion o boton simplemente no aparece en el
sitio. Nunca inventes un dato de contacto, un testimonio, o una cifra que no te dieron.

## Paso 2 — Elegir plantilla / estilo

Definí antes de escribir HTML:

- **Paleta**: los colores que dieron, o si no dieron, algo que calce con el rubro (tonos
  tierra/calidos para comida o artesanal, azul marino/dorado para servicios
  profesionales, verde salvia/rosa para bienestar — nunca el azul/violeta generico de
  SaaS). Un acento, un color de texto oscuro, un fondo claro.
- **Tipografia**: un par de Google Fonts (titulo + texto) que calce con el tono — variá
  el par entre demos, no repitas siempre el mismo.
- **Angulo del hero**: una frase de menos de 8 palabras que resuma el diferenciador + para
  quien es.

## Paso 3 — Fotos reales

El repo `webgency2` ya tiene una clave de Unsplash configurada para su propio editor de
demos (`UNSPLASH_ACCESS_KEY` en su `.env.local`). Si la tenes disponible en este entorno:

```bash
curl -s "https://api.unsplash.com/search/photos?query=RUBRO_O_PALABRA_CLAVE&per_page=6&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY"
```

Elegi 2-4 fotos relevantes (hero, nosotros, 1-2 en servicios), `alt` descriptivo real, y
un credito discreto en el footer ("Fotos: Unsplash"). Si no hay clave disponible o no
encontras nada relevante, usa `https://picsum.photos/seed/<slug>-N/1200/800` como
respaldo — nunca dejes una imagen rota.

## Paso 4 — Slug y colision

Convertí el nombre a slug (minusculas, sin tildes, guiones en vez de espacios) y revisá si
ya existe `docs/<slug>/` en el repo. Si existe y es el mismo negocio, tratalo como
actualizacion (mismo slug, mismo link, regeneras el contenido). Si es otro negocio con
nombre parecido, agregale `-2` al slug.

## Paso 5 — Escribir y publicar el sitio

Crea `docs/<slug>/` con:

- `index.html` (Inicio), `nosotros.html`, `servicios.html`, `contacto.html`, y
  `testimonios.html` solo si hay testimonios reales.
- Mismo `<header>`/`<nav>`/`<footer>` en las cinco paginas, pagina activa marcada. Links
  reales entre paginas (`href="servicios.html"`) — nunca anclas `#seccion` dentro de una
  sola pagina larga; el cliente tiene que poder navegar como en un sitio de verdad.
- `style.css` propio de este demo (no reutilices el de otro demo) — flexbox/grid a mano,
  nada de Bootstrap/Tailwind por CDN. Cada pagina con su propio layout, no la misma
  grilla de 3 columnas copiada en todos lados.
- `script.js` chico: el toggle del menu movil (hamburguesa real y funcional).
- Contacto: boton `tel:` si dieron telefono, `https://wa.me/NUMERO` si dieron WhatsApp,
  iframe de Google Maps estatico si dieron direccion (`https://www.google.com/maps?q=DIRECCION&output=embed`,
  no necesita API key). Un "formulario de contacto", si lo hay, manda por `mailto:` — es
  un sitio estatico sin backend, prometer un formulario que no llega a ningun lado es peor
  que no tenerlo.

Despues, en el repo:

```bash
git add docs/<slug>
git commit -m "Demo: NOMBRE_DEL_NEGOCIO"
git push origin main
```

## Paso 6 — Si venís del formulario "Nuevo Demo"

Cuando el usuario pida procesar solicitudes pendientes (o vos mismo detectes que hay que
revisarlas), la cola vive en un Artifact con capacidad `db`:

```
url: https://claude.ai/code/artifact/ad98aa4e-052e-4cbe-bc0d-b162b3ced1a2
coleccion: solicitudes
```

1. Lee las pendientes: accion `read_db`, `db_op` `query`, `collection` `solicitudes`,
   `query: {"where": [["status", "==", "pendiente"]]}`.
2. Por cada una: marcala `procesando` (accion `write_db`, `db_op` `update`) para que no se
   procese dos veces, usa sus campos como las respuestas del Paso 1 (sin volver a
   preguntar — no hay nadie del otro lado), segui los Pasos 2 a 5, y al terminar
   actualiza el mismo documento con `{"status": "listo", "url": "https://daniel666674.github.io/webgency2/<slug>/"}`.
3. Si algo falla, actualiza con `{"status": "error", "error": "<motivo breve en espanol>"}`
   en vez de dejarla trabada en "procesando".

Esta cola NO se procesa sola todavia — no hay ninguna automatizacion corriendo en
segundo plano (se intento con una rutina programada y fallo por falta de acceso al
repo en ese contexto). Procesarla requiere que alguien le pida explicitamente a Claude
que lo haga, en una sesion como esta que sí tiene acceso al repo.

## Paso 7 — Entregar

```
Link: https://daniel666674.github.io/webgency2/<slug>/
```

Avisa que GitHub Pages tarda ~30-60 segundos en reflejar el cambio despues del push. Si
es la primera vez que se publica algo en `docs/` de este repo, recordale al usuario que
GitHub Pages debe estar activado una vez (Settings → Pages → Branch `main` / carpeta
`/docs`) — si el link tira 404, es por eso, no por un error de la skill.

## Notas

- Nunca inventes telefono, email, WhatsApp, direccion, testimonios, cifras o clientes que
  el usuario no haya dado.
- No repitas la misma estructura/paleta/tipografia de un demo a otro.
- Responde en el idioma del usuario (por defecto, espanol).
