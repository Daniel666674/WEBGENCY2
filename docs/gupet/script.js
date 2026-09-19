// Menu movil
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  // Selector de presentacion/peso: actualiza el precio en tiempo real.
  // (Esto es justo lo que falla en el sitio actual de WooCommerce.)
  var selectors = document.querySelectorAll('.weight-select');
  selectors.forEach(function (group) {
    var buttons = group.querySelectorAll('button');
    var card = group.closest('.product-card');
    var priceEl = card ? card.querySelector('.price') : null;
    var oldPriceEl = card ? card.querySelector('.price-old') : null;
    var unitEl = card ? card.querySelector('.price-unit') : null;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        if (priceEl && btn.dataset.price) {
          priceEl.textContent = '$' + Number(btn.dataset.price).toLocaleString('es-CO');
        }
        if (oldPriceEl) {
          if (btn.dataset.old) {
            oldPriceEl.style.display = '';
            oldPriceEl.textContent = '$' + Number(btn.dataset.old).toLocaleString('es-CO');
          } else {
            oldPriceEl.style.display = 'none';
          }
        }
        if (unitEl && btn.dataset.unit) {
          unitEl.textContent = btn.dataset.unit;
        }
      });
    });
  });
});
