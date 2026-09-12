/**
 * MAVIÈ STUDIO — Estética y Bienestar (Zaragoza)
 * JavaScript modular, ligero y accesible.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initMobileNav();
    initBeforeAfterSliders();
    initMultiTabComparator();
    initFaqAccordion();
    initCategoryFilter();
    initHomeFilterPills();
    initScrollReveal();
    initWaTooltip();
    initWaPildora();
    initOpeningHours();
    initMobileCtaBar();
    initBackToTop();
    initReadProgress();
    initLazyFade();
    initSmoothAnchors();
    initNavMenus();
    initMobileAccordion();
    initRecomendador();
    initHeroReel();
  });

  /* ========================================================================
     1. CABECERA: sombra al hacer scroll y ocultación al bajar
     ======================================================================== */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('scrolled', y > 25);

      // Se oculta al bajar (solo tras superar la zona de cabecera) y reaparece al subir
      var drawerOpen = document.body.classList.contains('nav-open');
      if (!drawerOpen && y > 320 && y > lastY + 6) {
        header.classList.add('header-hidden');
      } else if (y < lastY - 6 || y <= 320) {
        header.classList.remove('header-hidden');
      }

      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    // Altura real de la cabecera para scroll-padding
    function measure() {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });
    update();
  }

  /* ========================================================================
     2. MENÚ MÓVIL con trampa de foco
     ======================================================================== */
  function initMobileNav() {
    var toggleBtn = document.querySelector('.btn-menu-toggle');
    var drawer = document.querySelector('.mobile-nav-drawer');
    var backdrop = document.querySelector('.mobile-nav-backdrop');
    var closeBtn = document.querySelector('.btn-close-drawer');
    if (!toggleBtn || !drawer || !backdrop) return;

    var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function open() {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('nav-open');
      var first = drawer.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    function close() {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.body.classList.remove('nav-open');
      toggleBtn.focus();
    }

    toggleBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;

      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;

      var items = Array.prototype.filter.call(
        drawer.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    Array.prototype.forEach.call(drawer.querySelectorAll('a'), function (link) {
      link.addEventListener('click', close);
    });

    // Al pasar a escritorio, el cajón nunca debe quedar abierto
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992 && drawer.classList.contains('open')) close();
    }, { passive: true });
  }

  /* ========================================================================
     3. COMPARADOR ANTES / DESPUÉS
        Pointer Events + teclado + semántica de slider
     ======================================================================== */
  function initBeforeAfterSliders() {
    var containers = document.querySelectorAll('.ba-container');
    if (!containers.length) return;

    Array.prototype.forEach.call(containers, function (container) {
      var after = container.querySelector('.ba-after');
      var handle = container.querySelector('.ba-handle');
      if (!after || !handle) return;

      var pct = 50;
      var dragging = false;

      container.setAttribute('tabindex', '0');
      container.setAttribute('role', 'slider');
      container.setAttribute('aria-label', 'Comparador antes y después: usa las flechas para desplazar');
      container.setAttribute('aria-valuemin', '0');
      container.setAttribute('aria-valuemax', '100');

      function apply() {
        after.style.width = pct + '%';
        handle.style.left = pct + '%';
        container.setAttribute('aria-valuenow', Math.round(pct));
        container.setAttribute('aria-valuetext', 'Después visible al ' + Math.round(pct) + '%');
      }

      function setFromX(clientX) {
        var rect = container.getBoundingClientRect();
        if (!rect.width) return;
        var x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        pct = (x / rect.width) * 100;
        apply();
      }

      function onMove(e) {
        if (!dragging) return;
        e.preventDefault();
        setFromX(e.clientX);
      }

      function stop() {
        dragging = false;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', stop);
      }

      container.addEventListener('pointerdown', function (e) {
        dragging = true;
        setFromX(e.clientX);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', stop);
      });

      container.addEventListener('keydown', function (e) {
        var step = e.shiftKey ? 10 : 3;
        if (e.key === 'ArrowLeft') { pct = Math.max(0, pct - step); }
        else if (e.key === 'ArrowRight') { pct = Math.min(100, pct + step); }
        else if (e.key === 'Home') { pct = 0; }
        else if (e.key === 'End') { pct = 100; }
        else { return; }
        e.preventDefault();
        apply();
      });

      // La imagen recortada debe conservar el ancho completo del contenedor
      function sizeInner() {
        var img = after.querySelector('img');
        if (img && container.offsetWidth) img.style.width = container.offsetWidth + 'px';
      }
      window.addEventListener('resize', sizeInner, { passive: true });
      window.addEventListener('ba:resize', sizeInner);
      sizeInner();
      apply();
    });
  }

  /* ========================================================================
     4. PESTAÑAS DEL COMPARADOR
     ======================================================================== */
  function initMultiTabComparator() {
    var tabs = document.querySelectorAll('.ba-tab-btn');
    var panels = document.querySelectorAll('.ba-panel');
    if (!tabs.length || !panels.length) return;

    Array.prototype.forEach.call(tabs, function (btn) {
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs, function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        Array.prototype.forEach.call(panels, function (p) {
          p.classList.remove('active');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        var panel = document.getElementById(btn.getAttribute('data-target'));
        if (panel) {
          panel.classList.add('active');
          // Los comparadores ocultos no tienen ancho: hay que recalcularlos al mostrarlos
          window.dispatchEvent(new Event('ba:resize'));
        }
      });
    });
  }

  /* ========================================================================
     5. ACORDEÓN DE PREGUNTAS FRECUENTES
     ======================================================================== */
  function initFaqAccordion() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    Array.prototype.forEach.call(items, function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        Array.prototype.forEach.call(items, function (other) {
          if (other !== item && other.open) other.removeAttribute('open');
        });
      });
    });
  }

  /* ========================================================================
     6 y 7. FILTROS DE TRATAMIENTOS
     ======================================================================== */
  function filterCards(cards, value) {
    var shown = 0;
    Array.prototype.forEach.call(cards, function (card) {
      var match = value === 'all' || card.getAttribute('data-category') === value;
      card.hidden = !match;
      card.style.display = match ? '' : 'none';
      if (match) {
        shown++;
        card.classList.add('is-visible');
      }
    });
    return shown;
  }

  function emptyNotice(grid) {
    var box = grid.parentNode.querySelector('.filter-empty');
    if (!box) {
      box = document.createElement('p');
      box.className = 'filter-empty';
      box.setAttribute('role', 'status');
      box.style.cssText = 'text-align:center;padding:2.5rem 1rem;color:var(--muted-text);';
      box.textContent = 'No hay tratamientos en esta categoría. Prueba con otra selección.';
      grid.parentNode.insertBefore(box, grid.nextSibling);
    }
    return box;
  }

  function initCategoryFilter() {
    var btns = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.treatment-card[data-category]');
    if (!btns.length || !cards.length) return;

    var grid = cards[0].parentNode;
    var notice = emptyNotice(grid);
    notice.hidden = true;

    Array.prototype.forEach.call(btns, function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('btn-primary') ? 'true' : 'false');

      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(btns, function (b) {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        btn.setAttribute('aria-pressed', 'true');

        notice.hidden = filterCards(cards, btn.getAttribute('data-filter')) > 0;
      });
    });
  }

  function initHomeFilterPills() {
    var pills = document.querySelectorAll('.filter-tab-pill');
    var cards = document.querySelectorAll('.treatments-grid .treatment-card');
    if (!pills.length || !cards.length) return;

    var grid = document.querySelector('.treatments-grid');
    var notice = emptyNotice(grid);
    notice.hidden = true;

    Array.prototype.forEach.call(pills, function (pill) {
      pill.setAttribute('aria-pressed', pill.classList.contains('active') ? 'true' : 'false');

      pill.addEventListener('click', function () {
        Array.prototype.forEach.call(pills, function (p) {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');

        notice.hidden = filterCards(cards, pill.getAttribute('data-category')) > 0;
      });
    });
  }

  /* ========================================================================
     8. REVELADO AL HACER SCROLL
     ======================================================================== */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal-on-scroll');
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

    Array.prototype.forEach.call(els, function (el) { observer.observe(el); });
  }

  /* ========================================================================
     9. AVISO FLOTANTE DE WHATSAPP (una vez por sesión)
     ======================================================================== */
  // La píldora de WhatsApp se asoma sola una vez por sesión
  function initWaPildora() {
    var fab = document.querySelector('.whatsapp-floating');
    if (!fab || !fab.querySelector('.wa-pill')) return;
    var KEY = 'mavie-wa-pill';
    try { if (window.sessionStorage && sessionStorage.getItem(KEY)) return; } catch (err) { return; }

    window.setTimeout(function () {
      fab.classList.add('wa-mostrar');
      window.setTimeout(function () {
        fab.classList.remove('wa-mostrar');
        try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* ignorar */ }
      }, 4200);
    }, 2600);
  }

  function initWaTooltip() {
    var tooltip = document.querySelector('.whatsapp-tooltip');
    var closeBtn = document.querySelector('.whatsapp-tooltip-close');
    if (!tooltip) return;

    var KEY = 'mavie-wa-tip';
    try {
      if (window.sessionStorage && sessionStorage.getItem(KEY)) return;
    } catch (err) { /* almacenamiento no disponible */ }

    var timer = setTimeout(function () {
      tooltip.classList.add('is-visible');
    }, 6000);

    var hide = setTimeout(function () {
      tooltip.classList.remove('is-visible');
    }, 20000);

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        tooltip.classList.remove('is-visible');
        clearTimeout(timer);
        clearTimeout(hide);
        try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* ignorar */ }
      });
    }
  }

  /* ========================================================================
     10. HORARIO REAL: estado abierto/cerrado y día en curso
     ======================================================================== */
  // Índice = día JS (0 domingo). Tramos en minutos desde medianoche.
  var SCHEDULE = {
    0: [],
    1: [[720, 1200]],
    2: [[720, 1200]],
    3: [[570, 810], [960, 1200]],
    4: [[570, 1050]],
    5: [[570, 1050]],
    6: []
  };
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function fmt(mins) {
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return h + (m ? ':' + (m < 10 ? '0' + m : m) : ':00') + 'h';
  }

  function nextOpening(day, minutes) {
    for (var i = 0; i < 8; i++) {
      var d = (day + i) % 7;
      var slots = SCHEDULE[d];
      for (var j = 0; j < slots.length; j++) {
        if (i > 0 || slots[j][0] > minutes) {
          return { day: d, start: slots[j][0], today: i === 0, tomorrow: i === 1 };
        }
      }
    }
    return null;
  }

  function initOpeningHours() {
    var badges = document.querySelectorAll('[data-open-badge]');
    var now = new Date();
    var day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();

    // Resaltar la fila del día en curso
    Array.prototype.forEach.call(document.querySelectorAll('.hours-table tr[data-day]'), function (tr) {
      if (parseInt(tr.getAttribute('data-day'), 10) === day) tr.classList.add('is-today');
    });

    if (!badges.length) return;

    var openNow = null;
    SCHEDULE[day].forEach(function (slot) {
      if (mins >= slot[0] && mins < slot[1]) openNow = slot;
    });

    var label, cls;
    if (openNow) {
      label = 'Abierto ahora · cierra a las ' + fmt(openNow[1]);
      cls = 'is-open';
    } else {
      var next = nextOpening(day, mins);
      cls = 'is-closed';
      if (!next) {
        label = 'Cerrado · escríbenos por WhatsApp';
      } else if (next.today) {
        label = 'Cerrado · abre hoy a las ' + fmt(next.start);
      } else if (next.tomorrow) {
        label = 'Cerrado · abre mañana a las ' + fmt(next.start);
      } else {
        label = 'Cerrado · abre el ' + DAY_NAMES[next.day] + ' a las ' + fmt(next.start);
      }
    }

    Array.prototype.forEach.call(badges, function (b) {
      b.textContent = label;
      b.classList.remove('is-open', 'is-closed');
      b.classList.add(cls);
    });
  }

  /* ========================================================================
     11. BARRA DE ACCIÓN MÓVIL
     ======================================================================== */
  function initMobileCtaBar() {
    var bar = document.querySelector('.mobile-cta-bar');
    if (!bar) return;

    document.body.classList.add('has-mobile-cta');
    var ticking = false;

    function update() {
      var show = window.scrollY > 420;
      bar.classList.toggle('is-visible', show);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ========================================================================
     12. VOLVER ARRIBA
     ======================================================================== */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;

    var ticking = false;
    function update() {
      btn.classList.toggle('is-visible', window.scrollY > 700);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    update();
  }

  /* ========================================================================
     13. BARRA DE PROGRESO DE LECTURA
     ======================================================================== */
  function initReadProgress() {
    var bar = document.createElement('div');
    bar.className = 'read-progress';
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = h > 0 ? (window.scrollY / h) * 100 + '%' : '0';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ========================================================================
     14. APARICIÓN SUAVE DE LAS IMÁGENES DIFERIDAS
     ======================================================================== */
  function initLazyFade() {
    var imgs = document.querySelectorAll('img[loading="lazy"]');
    Array.prototype.forEach.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) return;
      img.classList.add('lazy-fade');
      img.addEventListener('load', function () { img.classList.add('is-loaded'); });
      img.addEventListener('error', function () { img.classList.add('is-loaded'); });
    });
  }

  /* ========================================================================
     15. ANCLAS SUAVES
     ======================================================================== */
  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;

      var id = link.getAttribute('href');
      if (!id || id === '#') return;

      var target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ========================================================================
     16. MEGA-MENÚ Y DESPLEGABLES DE ESCRITORIO
        Se abren con el ratón y también con clic o teclado, para que funcionen
        en portátiles táctiles y tabletas, donde el hover no existe.
     ======================================================================== */
  function initNavMenus() {
    var items = document.querySelectorAll('.nav-desktop .has-dropdown');
    if (!items.length) return;

    var puedeHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // El estado se lee del DOM: llevar un array aparte se desincronizaba
    function hayAbiertos() {
      return document.querySelectorAll('.nav-desktop .has-dropdown.is-open').length > 0;
    }

    function panelDe(item) {
      return item.querySelector('.nav-mega, .nav-dropdown');
    }

    function abrir(item) {
      cerrarTodos(item);
      var panel = panelDe(item);
      var trigger = item.querySelector('.nav-trigger');
      if (!panel) return;
      panel.hidden = false;
      // El panel debe estar ya en el flujo antes de animarlo, o la
      // transición no llega a arrancar.
      window.requestAnimationFrame(function () {
        item.classList.add('is-open');
      });
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    }

    function cerrar(item) {
      var panel = panelDe(item);
      var trigger = item.querySelector('.nav-trigger');
      item.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      // El panel se oculta al terminar la transición para no cortar la animación
      if (panel) {
        window.setTimeout(function () {
          if (!item.classList.contains('is-open')) panel.hidden = true;
        }, 300);
      }
    }

    function cerrarTodos(excepto) {
      Array.prototype.forEach.call(items, function (otro) {
        if (otro !== excepto && otro.classList.contains('is-open')) cerrar(otro);
      });
    }

    Array.prototype.forEach.call(items, function (item) {
      var trigger = item.querySelector('.nav-trigger');
      var panel = panelDe(item);
      if (!trigger || !panel) return;

      var temporizador = null;

      if (puedeHover) {
        item.addEventListener('mouseenter', function () {
          window.clearTimeout(temporizador);
          abrir(item);
        });
        item.addEventListener('mouseleave', function () {
          // Margen para que el ratón pueda cruzar el hueco hasta el panel
          temporizador = window.setTimeout(function () { cerrar(item); }, 180);
        });
      }

      // Sin hover (táctil): el primer toque abre, el segundo navega
      trigger.addEventListener('click', function (e) {
        if (puedeHover) return;
        if (!item.classList.contains('is-open')) {
          e.preventDefault();
          abrir(item);
        }
      });

      // Teclado
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          abrir(item);
          window.setTimeout(function () {
            var primero = panel.querySelector('a, button');
            if (primero) primero.focus();
          }, 0);
        }
      });

      panel.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        cerrar(item);
        trigger.focus();
      });

      // Al salir con el tabulador del panel, se cierra
      item.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!item.contains(document.activeElement)) cerrar(item);
        }, 0);
      });

    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hayAbiertos()) cerrarTodos(null);
    });

    document.addEventListener('click', function (e) {
      if (!hayAbiertos()) return;
      if (!e.target.closest || !e.target.closest('.nav-desktop .has-dropdown.is-open')) {
        cerrarTodos(null);
      }
    });

    // Al hacer scroll con la cabecera oculta, no debe quedar un panel colgando
    window.addEventListener('scroll', function () {
      if (hayAbiertos() && document.querySelector('.site-header.header-hidden')) cerrarTodos(null);
    }, { passive: true });
  }

  /* ========================================================================
     17. ACORDEÓN DEL CAJÓN MÓVIL
     ======================================================================== */
  function initMobileAccordion() {
    var botones = document.querySelectorAll('.m-acc-btn');
    if (!botones.length) return;

    Array.prototype.forEach.call(botones, function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        var abierto = btn.getAttribute('aria-expanded') === 'true';

        if (abierto) {
          btn.setAttribute('aria-expanded', 'false');
          panel.hidden = true;
          return;
        }

        // Solo una sección abierta a la vez: el cajón se mantiene corto
        Array.prototype.forEach.call(botones, function (otro) {
          if (otro === btn) return;
          var p = document.getElementById(otro.getAttribute('aria-controls'));
          otro.setAttribute('aria-expanded', 'false');
          if (p) p.hidden = true;
        });

        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      });
    });
  }

  /* ========================================================================
     18. RECOMENDADOR DE TRATAMIENTO
        Tres preguntas y dos propuestas. Todo en el navegador: no se envía
        ni se guarda nada.
     ======================================================================== */
  function initRecomendador() {
    var caja = document.querySelector('[data-reco]');
    var fuente = document.getElementById('reco-datos');
    if (!caja || !fuente) return;

    var datos;
    try { datos = JSON.parse(fuente.textContent); } catch (err) { return; }
    if (!datos || !datos.length) return;

    var pasos = caja.querySelectorAll('.reco-paso');
    var relleno = caja.querySelector('.reco-barra-fill');
    var cuenta = caja.querySelector('.reco-cuenta strong');
    var atras = caja.querySelector('.reco-atras');
    var resultado = caja.querySelector('.reco-result');
    var tarjetas = caja.querySelector('.reco-cards');
    var reiniciar = caja.querySelector('[data-reco-reset]');
    var pie = caja.querySelector('.reco-pie');
    var form = caja.querySelector('.reco-form');

    var respuestas = {};
    var actual = 1;

    var MINUTOS = { corto: 35, medio: 60, largo: 95 };

    function mostrar(n) {
      actual = n;
      Array.prototype.forEach.call(pasos, function (p) {
        p.hidden = parseInt(p.getAttribute('data-paso'), 10) !== n;
      });
      relleno.style.width = Math.round((n / pasos.length) * 100) + '%';
      if (cuenta) cuenta.textContent = n;
      atras.hidden = n === 1;
      var primero = pasos[n - 1].querySelector('.reco-op');
      if (primero) primero.focus();
    }

    function puntuar(t) {
      // Fuera de la categoría elegida no compite
      if (t.c !== respuestas.q1) return null;
      // Los complementos no se reservan solos: se ofrecen aparte
      if (t.add) return null;

      var punt = 100;

      // Cercanía a la duración disponible
      var objetivo = MINUTOS[respuestas.q2] || 60;
      punt -= Math.abs(t.m - objetivo) * 0.6;

      // Con poco tiempo, lo que no cabe se descarta de verdad
      if (respuestas.q2 === 'corto' && t.m > 55) punt -= 30;

      // Primera visita: se prioriza lo sencillo y se evita lo avanzado
      if (respuestas.q3 === 'si') {
        punt += t.nv ? 18 : -22;
      } else if (!t.nv) {
        punt += 8;
      }

      // Con el precio cerrado se decide mejor
      if (t.p) punt += 6;

      return punt;
    }

    function motivo(t) {
      if (respuestas.q3 === 'si' && t.nv) return 'Buen punto de partida si es tu primera vez';
      if (respuestas.q2 === 'corto' && t.m <= 45) return 'Entra de sobra en el tiempo que tienes';
      if (respuestas.q2 === 'largo' && t.m >= 60) return 'Aprovecha el tiempo del que dispones';
      if (respuestas.q3 === 'no' && !t.nv) return 'Un paso más si ya conoces la casa';
      return 'Encaja con lo que nos cuentas';
    }

    function pintar() {
      var orden = datos
        .map(function (t) { return { t: t, p: puntuar(t) }; })
        .filter(function (x) { return x.p !== null; })
        .sort(function (a, b) { return b.p - a.p; });

      // La segunda propuesta busca otro tipo dentro de la categoría: dos
      // pedicuras seguidas para «mis uñas» no ayudan a decidir.
      var lista = orden.slice(0, 1);
      if (orden.length > 1) {
        var distinta = null;
        for (var i = 1; i < orden.length; i++) {
          if (orden[i].t.g !== lista[0].t.g) { distinta = orden[i]; break; }
        }
        // Solo se fuerza la variedad si la alternativa sigue encajando:
        // ofrecer algo mucho peor por ser distinto no ayuda a nadie.
        var vale = distinta && (orden[1].p - distinta.p) <= 20;
        lista.push(vale ? distinta : orden[1]);
      }

      tarjetas.innerHTML = lista.map(function (x, i) {
        var t = x.t;
        var precio = t.p
          ? '<span class="reco-card-precio">' + t.p + ' €</span>'
          : '<span class="reco-card-precio is-pendiente">Precio a confirmar</span>';
        var dur = t.dur ? '<span class="reco-card-dur">⏱️ ' + t.dur + '</span>' : '';
        var wa = 'https://wa.me/34668508795?text=' +
          encodeURIComponent('Hola, me gustaría reservar cita para ' + t.n + ' en MAVIÈ Studio.');

        return '' +
          '<article class="reco-card' + (i === 0 ? ' is-primera' : '') + '">' +
            (i === 0 ? '<span class="reco-card-tag">Nuestra primera opción</span>' : '') +
            '<a class="reco-card-media" href="' + t.s + '.html" tabindex="-1" aria-hidden="true">' +
              '<img src="' + t.img + '" alt="" loading="lazy" decoding="async">' +
            '</a>' +
            '<div class="reco-card-body">' +
              '<span class="reco-card-motivo">' + motivo(t) + '</span>' +
              '<h3 class="reco-card-nombre"><a href="' + t.s + '.html">' + t.n + '</a></h3>' +
              '<p class="reco-card-desc">' + t.d + '</p>' +
              '<div class="reco-card-meta">' + precio + dur + '</div>' +
              '<div class="reco-card-cta">' +
                '<a class="btn btn-whatsapp btn-sm" href="' + wa + '" target="_blank" rel="noopener">Reservar por WhatsApp</a>' +
                '<a class="link-arrow" href="' + t.s + '.html">Ver detalles &rarr;</a>' +
              '</div>' +
            '</div>' +
          '</article>';
      }).join('');

      // El complemento se propone como añadido, nunca como opción principal
      var extra = caja.querySelector('.reco-extra');
      var comp = datos.filter(function (x) { return x.add && x.c === respuestas.q1; })[0];
      if (extra) extra.remove();
      if (comp) {
        var p = document.createElement('p');
        p.className = 'reco-extra';
        p.innerHTML = 'Y si quieres rematarlo: puedes añadir <a href="' + comp.s + '.html">' +
          comp.n + '</a> a cualquier manicura o pedicura por <strong>' + comp.p + ' €</strong>.';
        tarjetas.insertAdjacentElement('afterend', p);
      }

      form.hidden = true;
      pie.hidden = true;
      resultado.hidden = false;
      relleno.style.width = '100%';
      resultado.focus();
    }

    caja.addEventListener('click', function (e) {
      var op = e.target.closest ? e.target.closest('.reco-op') : null;
      if (!op) return;

      respuestas[op.getAttribute('data-q')] = op.getAttribute('data-v');

      var hermanos = op.parentNode.querySelectorAll('.reco-op');
      Array.prototype.forEach.call(hermanos, function (b) {
        b.classList.toggle('is-elegida', b === op);
      });

      if (actual < pasos.length) {
        window.setTimeout(function () { mostrar(actual + 1); }, 180);
      } else {
        window.setTimeout(pintar, 180);
      }
    });

    atras.addEventListener('click', function () {
      if (actual > 1) mostrar(actual - 1);
    });

    reiniciar.addEventListener('click', function () {
      respuestas = {};
      Array.prototype.forEach.call(caja.querySelectorAll('.reco-op'), function (b) {
        b.classList.remove('is-elegida');
      });
      resultado.hidden = true;
      form.hidden = false;
      pie.hidden = false;
      tarjetas.innerHTML = '';
      var ex = caja.querySelector('.reco-extra');
      if (ex) ex.remove();
      mostrar(1);
    });

    // Estado inicial sin robar el foco al cargar la página
    Array.prototype.forEach.call(pasos, function (p) {
      p.hidden = parseInt(p.getAttribute('data-paso'), 10) !== 1;
    });
  }

  /* ========================================================================
     20. CABECERA EN SECUENCIA
     Encadena las fotografías reales del estudio como si fuese un vídeo.
     Se detiene cuando la pestaña no se ve o el hero queda fuera de pantalla,
     y respeta la preferencia de movimiento reducido.
     ======================================================================== */
  function initHeroReel() {
    var reel = document.querySelector('[data-hero-reel]');
    if (!reel) return;

    var slides = reel.querySelectorAll('[data-hr-slide]');
    var barras = reel.querySelectorAll('[data-hr-bar]');
    if (slides.length < 2) return;

    var DURACION = 5400;
    reel.style.setProperty('--hr-duracion', (DURACION / 1000) + 's');

    // Pies de foto: qué se está viendo y a dónde lleva
    var pies = [];
    var datos = reel.querySelector('[data-hr-pies]');
    if (datos) {
      try { pies = JSON.parse(datos.textContent); } catch (e) { pies = []; }
    }
    var pie = reel.querySelector('[data-hr-caption]');
    var pieK = reel.querySelector('[data-hr-k]');
    var pieV = reel.querySelector('[data-hr-v]');

    var actual = 0;
    var reloj = null;
    var enPantalla = true;
    var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function pintarPie(i) {
      if (!pie || !pies[i] || !pieK || !pieV) return;
      if (pieK.textContent === pies[i].k) return;
      pie.classList.add('is-cambiando');
      window.setTimeout(function () {
        pieK.textContent = pies[i].k;
        pieV.textContent = pies[i].v;
        pie.setAttribute('href', pies[i].u);
        pie.classList.remove('is-cambiando');
      }, 280);
    }

    function ir(i) {
      if (i === actual) return;
      var saliente = slides[actual];
      saliente.classList.remove('is-active');
      saliente.classList.add('is-prev');
      window.setTimeout(function () { saliente.classList.remove('is-prev'); }, 1600);

      actual = i;
      slides[actual].classList.add('is-active');

      // Las siguientes se piden con algo de antelación para que no parpadeen
      var siguiente = slides[(actual + 1) % slides.length].querySelector('img');
      if (siguiente && siguiente.loading === 'lazy') siguiente.loading = 'eager';

      Array.prototype.forEach.call(barras, function (b, n) {
        b.classList.remove('is-active');
        b.classList.toggle('is-seen', n < actual);
        if (n === actual) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      // Forzamos el reinicio de la barra que se pone en marcha
      if (barras[actual]) {
        void barras[actual].offsetWidth;
        barras[actual].classList.add('is-active');
      }

      pintarPie(actual);
    }

    function avanzar() { ir((actual + 1) % slides.length); }

    function arrancar() {
      if (quieto || reloj || !enPantalla || document.hidden) return;
      reloj = window.setInterval(avanzar, DURACION);
    }
    function parar() {
      if (reloj) { window.clearInterval(reloj); reloj = null; }
    }

    // Salto manual desde las barritas
    Array.prototype.forEach.call(barras, function (b, n) {
      b.addEventListener('click', function () {
        parar();
        ir(n);
        arrancar();
      });
    });

    // Deslizar con el dedo
    var x0 = null, y0 = null;
    reel.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    reel.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      parar();
      ir(dx < 0 ? (actual + 1) % slides.length
                : (actual - 1 + slides.length) % slides.length);
      arrancar();
    }, { passive: true });

    // Nada de girar en segundo plano
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) parar(); else arrancar();
    });

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entradas) {
        enPantalla = entradas[0].isIntersecting;
        if (enPantalla) arrancar(); else parar();
      }, { threshold: 0.12 });
      obs.observe(reel);
    }

    if (barras[0]) barras[0].classList.add('is-active');
    arrancar();
  }
})();
