# Crear Demo Web (/crear-demo)

Generas un sitio de demostracion real — varias paginas HTML estaticas, navegacion que
funciona, contenido escrito a mano — para mostrarle a un negocio pequeno. Se publica en
GitHub Pages desde este mismo repo, sin crear repos nuevos ni tocar la app del CRM.

**No es un generador de landing pages de IA.** Nada de hero-con-3-iconos, nada de blobs
degradados, nada de "Descubre tu potencial". Tiene que leerse como un sitio real que hizo
una agencia para un cliente real.

## Paso 1 — Pedir todo de una sola vez

No hagas preguntas una por una. Mostra este bloque tal cual y pedile al usuario que lo
llene completo (avisale que ya deberia tener los datos a mano):

```
Nombre del negocio:
Rubro / a que se dedican:
Objetivo del sitio (que llamen / que escriban / que compren / que reserven / solo dar confianza):
Publico al que le habla:
Diferenciador (por que lo eligen a el y no a la competencia):
Tono (cercano / profesional / premium / atrevido):
Colores de marca (o "elegi vos"):
Servicios o productos (lista):
Telefono / WhatsApp:
Email:
Direccion:
Instagram / Facebook:
Testimonios reales (pegalos si tienen; si no tienen, dejalo en blanco):
Fotos (links si tienen, o "usa fotos de stock"):
```

Reglas sobre la respuesta:
- Lo unico obligatorio es el **nombre del negocio**. Todo lo demas: si falta, se omite (nunca
  lo inventes) — un campo de contacto vacio significa que esa seccion/boton simplemente no
  aparece.
- Si no hay testimonios reales, **no crees la pagina de testimonios** ni inventes clientes.
- Si falta casi todo salvo el nombre, haces UNA sola pregunta de seguimiento pidiendo lo
  minimo indispensable (rubro + algun dato de contacto) — no multiples idas y vueltas.

## Paso 2 — Decidir el plan del sitio

Con las respuestas, definis antes de escribir una sola linea de HTML:

- **Paginas**: `index.html` (Inicio), `nosotros.html`, `servicios.html`, `contacto.html`
  siempre; `testimonios.html` solo si dieron testimonios reales.
- **Paleta**: los colores que dieron, o si no dieron, una paleta que calce con el rubro
  (tonos tierra/calidos para comida o artesanal, azul marino/dorado para servicios
  profesionales, verde salvia/rosa para bienestar, nunca el azul/violeta generico de SaaS).
  Elegi un color de acento, un color de texto oscuro y un fondo claro — 3 valores hex, y
  anotalos porque los usas en el CSS de todas las paginas.
- **Tipografia**: un par de Google Fonts (una para titulos, otra para texto) que calce con
  el tono — no uses el mismo par en todos los demos, variá segun el rubro/tono.
- **Angulo del hero**: una frase que resuma el diferenciador + para quien es, en menos de 8
  palabras.

## Paso 3 — Conseguir fotos reales

Este repo ya tiene integracion con Unsplash para el editor de demos del CRM
(`UNSPLASH_ACCESS_KEY` en `.env.local`, ver `src/app/api/demo-pages/image-search/route.ts`).
Reusala:

```bash
source .env.local 2>/dev/null
curl -s "https://api.unsplash.com/search/photos?query=RUBRO+O+PALABRA_CLAVE&per_page=6&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY"
```

Elegi 2-4 fotos relevantes (hero, nosotros, 1-2 en servicios). Usa la URL de `urls.regular`,
poné `alt` descriptivo real (no "imagen 1"), y agrega un credito discreto en el footer:
"Fotos: Unsplash". Si `UNSPLASH_ACCESS_KEY` no esta configurada o la busqueda no devuelve
nada relevante, usa `https://picsum.photos/seed/SLUG-1/1200/800` (cambiando el numero de
seed por foto) como respaldo — nunca dejes un `<img>` roto.

## Paso 4 — Slug y colision

```bash
SLUG=$(echo "NOMBRE_DEL_NEGOCIO" | iconv -t ascii//TRANSLIT | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//')
ls docs/ 2>/dev/null | grep -x "$SLUG"
```

- Si ya existe una carpeta `docs/$SLUG` y es el mismo negocio (mismo nombre, quiza pidiendo
  cambios) → tratalo como **actualizacion**: regeneras el contenido, mismo slug, mismo link.
  Confirma con el usuario que efectivamente es una actualizacion antes de sobreescribir.
- Si es un negocio distinto con nombre parecido → usa `$SLUG-2`, etc.

## Paso 5 — Escribir el sitio

Crea `docs/$SLUG/` con:

- `index.html`, `nosotros.html`, `servicios.html`, `contacto.html` (+ `testimonios.html` si
  aplica) — HTML semantico escrito a mano, mismo `<header>`/`<nav>`/`<footer>` en las cinco,
  con la pagina activa marcada (`aria-current="page"` + una clase visual).
- `style.css` propio de este demo (no reutilices un CSS de otro demo) — flexbox/grid a mano,
  nada de Bootstrap/Tailwind por CDN, nada de clases genericas `card-1 card-2 card-3`
  repetidas en cada seccion. Cada pagina tiene su propio layout, no la misma grilla de 3
  columnas copiada y pegada.
- `script.js` chico: solo el toggle del menu movil (hamburguesa real, funcional).
- Nav con links reales entre paginas (`href="servicios.html"`), nunca anclas `#seccion`
  dentro de una sola pagina larga.
- Contacto: si dieron telefono, boton `tel:`; si dieron WhatsApp, boton
  `https://wa.me/NUMERO`; si dieron direccion, iframe de Google Maps estatico (no requiere
  API key: `https://www.google.com/maps?q=DIRECCION&output=embed`). Si el "formulario de
  contacto" existe, que mande por `mailto:` — es un sitio estatico, no hay backend que
  reciba un POST, y prometer un formulario que no llega a ningun lado es peor que no tenerlo.
- Copy especifico del negocio, con la voz que describieron — nada de relleno de marketing
  generico ("lleva tu negocio al siguiente nivel", "en el mundo actual").

## Paso 6 — Publicar

```bash
git add docs/$SLUG docs/index.html
git commit -m "Demo: NOMBRE_DEL_NEGOCIO"
git push origin main
```

Antes del commit, agrega una entrada nueva a `docs/index.html` (justo arriba del comentario
`<!-- NUEVOS DEMOS -->` dentro del `<ul>`) y borra el `<li class="empty">` si todavia estaba.

## Paso 7 — Entregar

```
Link: https://daniel666674.github.io/webgency2/SLUG/
```

Avisa que GitHub Pages tarda ~30-60 segundos en reflejar el cambio despues del push. Si es
la primera vez que se usa `/crear-demo` en este repo, recordale al usuario que GitHub Pages debe
estar activado (Settings → Pages → Branch `main` / carpeta `/docs`) — si el link tira 404,
es porque falta ese paso, no un error del comando.

## Notas

- Nunca inventes telefono, email, WhatsApp, direccion, testimonios, cifras o clientes que el
  usuario no haya dado.
- No repitas la misma estructura/paleta/tipografia de un demo a otro — cada negocio es
  distinto y tiene que sentirse distinto.
- Responde en el idioma del usuario (por defecto, espanol).
