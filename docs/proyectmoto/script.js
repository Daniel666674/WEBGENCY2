// Menu movil
(function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('nav.main');
  if (!burger || !nav) return;

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Fallback de imagenes: si la foto real todavia no esta subida,
// se muestra el placeholder de marca en vez de una imagen rota.
document.querySelectorAll('img[data-ph]').forEach(function (img) {
  img.addEventListener('error', function handle() {
    img.removeEventListener('error', handle);
    img.src = img.getAttribute('data-ph');
  });
  if (img.complete && img.naturalWidth === 0) img.src = img.getAttribute('data-ph');
});

// Formulario de contacto -> abre WhatsApp con el mensaje ya armado.
// Es un sitio estatico (sin servidor), asi que en vez de un formulario que
// no llega a ningun lado, el mensaje se entrega por WhatsApp.
(function () {
  var form = document.getElementById('waForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    var texto =
      'Hola ProyectMoto, soy ' + v('nombre') + '.\n' +
      'Me interesa: ' + v('interes') + '.\n' +
      'Mi telefono: ' + v('tel') + '.' +
      (v('msg') ? '\n' + v('msg') : '');
    window.open('https://wa.me/573219138432?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  });
})();
