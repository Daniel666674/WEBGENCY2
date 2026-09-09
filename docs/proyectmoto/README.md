# Demo ProyectMoto

Sitio de demostración estático (HTML/CSS/JS, sin dependencias ni build).

Páginas: `index.html`, `productos.html`, `nosotros.html`, `testimonios.html`, `contacto.html`.

## Cómo poner las fotos reales

El sitio ya está preparado para tus 3 fotos. **No hay que tocar el código**: solo
sube los archivos a la carpeta `img/` con estos nombres exactos.

| Archivo            | Dónde aparece                                      |
|--------------------|----------------------------------------------------|
| `img/casco-1.jpg`  | Foto grande del inicio + primera ficha de productos |
| `img/casco-2.jpg`  | Tarjeta "Cascos" del inicio + segunda ficha         |
| `img/casco-3.jpg`  | Tarjeta "Protecciones" del inicio + tercera ficha   |
| `img/tienda.jpg`   | Página "Nosotros" (opcional)                        |
| `img/accesorios.jpg` | Tarjeta "Accesorios" del inicio (opcional)        |

Mientras un archivo no exista, se muestra automáticamente un placeholder
de marca (`img/ph-*.svg`) — nunca una imagen rota.

Recomendación: fotos horizontales, mínimo 1200 px de ancho, fondo limpio.

## Pendientes de contenido real

- **Testimonios**: los de `testimonios.html` son de ejemplo y están marcados como
  tales con un aviso visible. Reemplazar por reseñas reales de Google y borrar el
  bloque `<div class="disclaimer">`.
- **Horarios**: en `contacto.html` dicen "Consultar por WhatsApp" porque no se
  entregaron los horarios reales.
- **Email**: no se incluyó ninguno; el formulario de contacto entrega el mensaje
  por WhatsApp.
- **Logo**: el header usa un lockup tipográfico ("PM" + nombre). Si se sube el
  logo original como `img/logo.png`, se puede reemplazar.
