/**
 * MAVIÈ STUDIO — Asistente de la web
 *
 * Responde con lo que está escrito en las fichas: precios, duraciones,
 * horario, cuidados y las 83 preguntas frecuentes. Nunca improvisa.
 * Cuando la pregunta es personal, clínica o no está cubierta, pasa la
 * conversación a Marta por WhatsApp con la duda ya redactada.
 *
 * Todo ocurre en el navegador: no se envía ni se guarda nada.
 */
(function () {
  'use strict';

  var WA = 'https://wa.me/34668508795';
  var RUTA_KB = 'assets/data/asistente.json';

  var kb = null;
  var cargando = false;
  var panel, lista, campo, fab, formulario;

  /* ----------------------------------------------------------------------
     Utilidades de texto
     ---------------------------------------------------------------------- */
  var VACIAS = ('de la el los las un una unos unas y o u a en con por para que qué cual cuál como cómo ' +
    'es son ser está están mi mis tu tus se lo le me te si sí no del al mas más muy tan hay he ha ' +
    'hacer hace puedo puede pueden quiero quiere necesito tengo tiene sobre desde hasta pero ' +
    'cuanto cuánto cuanta cuánta cuando cuándo donde dónde quien quién porque por qué esto esta este').split(' ');

  function normalizar(t) {
    return (t || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function palabras(t) {
    return normalizar(t).split(' ').filter(function (p) {
      return p.length > 2 && VACIAS.indexOf(p) === -1;
    });
  }

  // Parecido entre dos palabras, para tolerar erratas ("manicur", "pestaña")
  function pareceIgual(a, b) {
    if (a === b) return 1;
    if (a.length > 4 && b.indexOf(a) === 0) return 0.9;
    if (b.length > 4 && a.indexOf(b) === 0) return 0.9;
    if (a.length > 5 && b.length > 5) {
      var raiz = Math.min(a.length, b.length) - 2;
      if (a.slice(0, raiz) === b.slice(0, raiz)) return 0.75;
    }
    return 0;
  }

  function solapa(consulta, texto) {
    var c = palabras(consulta), t = palabras(texto);
    if (!c.length || !t.length) return 0;
    var suma = 0;
    c.forEach(function (p) {
      var mejor = 0;
      t.forEach(function (q) { mejor = Math.max(mejor, pareceIgual(p, q)); });
      suma += mejor;
    });
    return suma / c.length;
  }

  /* ----------------------------------------------------------------------
     Diccionarios
     ---------------------------------------------------------------------- */
  var ALIAS = {
    'manicura-rusa': ['manicura rusa', 'rusa', 'cuticula', 'cuticulas', 'semipermanente manos'],
    'manicura-express': ['manicura express', 'manicura rapida', 'esmaltado rapido'],
    'manicura-sin-esmalte': ['sin esmalte', 'manicura natural', 'uñas naturales'],
    'extensiones-acrygel-gel': ['acrygel', 'gel', 'extensiones', 'extension de uñas', 'alargar uñas', 'uñas largas'],
    'pedicura-color': ['pedicura color', 'esmaltado pies', 'pedicura esmaltado'],
    'pedicura-higienica': ['pedicura higienica', 'durezas', 'talones', 'callos'],
    'pedicura-semipermanente': ['pedicura completa', 'pedicura semipermanente'],
    'spa-manos-pies': ['spa', 'exfoliacion', 'cuidado spa', 'hidratacion manos'],
    'lifting-pestanas': ['lifting', 'pestañas', 'pestanas', 'rizado', 'permanente pestañas', 'tinte pestañas'],
    'laminado-cejas': ['laminado', 'laminado cejas', 'browlift'],
    'tinte-cejas': ['tinte cejas', 'henna', 'color cejas'],
    'diseno-depilacion-cejas': ['cejas', 'diseño cejas', 'depilar cejas', 'marcaje'],
    'depilacion-laser': ['laser', 'diodo', 'depilacion laser', 'quitar vello'],
    'depilacion-cera': ['cera', 'depilacion', 'depilacion cera', 'ingles', 'axilas', 'piernas', 'vello'],
    'maderoterapia-1-hora': ['maderoterapia', 'maderoterapia hora', 'maderoterapia completa', 'celulitis', 'reafirmar', 'retencion', 'piernas cansadas'],
    'maderoterapia-30-minutos': ['maderoterapia 30', 'maderoterapia corta'],
    'dermapen-facial': ['dermapen', 'microneedling', 'exosomas', 'antiedad'],
    'peeling-quimico': ['peeling', 'acidos', 'manchas', 'marcas de acne'],
    'limpieza-facial-express': ['limpieza express', 'limpieza basica', 'limpieza rapida'],
    'limpieza-facial-profunda': ['limpieza profunda', 'puntos negros', 'extraccion', 'espatula'],
    'facial-activo-personalizado': ['facial personalizado', 'facial activo'],
    'essential-care-prebiotic': ['prebiotic', 'prebiotico', 'microbiota', 'piel sensible'],
    'facial-acne': ['acne', 'granos', 'piel grasa'],
    'facial-antiox-vitamina-c': ['vitamina c', 'antioxidante', 'luminosidad'],
    'facial-detox-pollution': ['detox', 'contaminacion', 'piel apagada'],
    'hidratacion-labial-dermapen': ['labios', 'labial', 'hidratacion labial']
  };

  // Temas que nunca se responden desde aquí: los valora Marta en cabina
  var CLINICO = ['embarazo', 'embarazada', 'embarazadas', 'lactancia', 'pecho', 'amamantando',
    'isotretinoina', 'roacutan', 'medicacion', 'medicamento', 'anticoagulante', 'antibiotico',
    'alergia', 'alergica', 'alergico', 'diabetes', 'diabetica', 'epilepsia', 'marcapasos',
    'cancer', 'quimio', 'quimioterapia', 'oncologico', 'lunar', 'lunares', 'melanoma',
    'dermatitis', 'psoriasis', 'rosacea', 'herpes', 'operada', 'cirugia', 'botox', 'relleno',
    'tatuaje', 'protesis', 'tiroides', 'anemia', 'hipertension'];

  // Cosas que sinceramente no sabemos
  var NO_CONSTA = {
    pago: ['pago', 'pagar', 'tarjeta', 'efectivo', 'bizum', 'financiacion', 'plazos', 'transferencia'],
    parking: ['aparcar', 'aparcamiento', 'parking', 'coche', 'autobus', 'tranvia', 'metro'],
    regalo: ['regalo', 'regalar', 'obsequio', 'cheque regalo', 'tarjeta regalo'],
    cancelar: ['cancelar', 'anular', 'cambiar cita', 'aplazar', 'retraso', 'llego tarde'],
    ninos: ['niño', 'niña', 'menor', 'menores', 'hijo', 'hija', 'adolescente'],
    grupo: ['grupo', 'despedida', 'amigas', 'evento', 'novia', 'boda']
  };

  /* ----------------------------------------------------------------------
     Mensajes
     ---------------------------------------------------------------------- */
  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function enlaceWA(texto, etiqueta) {
    return '<a class="chat-wa" href="' + WA + '?text=' + encodeURIComponent(texto) +
      '" target="_blank" rel="noopener">' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/></svg>' +
      (etiqueta || 'Preguntar a Marta') + '</a>';
  }

  // "60 min aprox." ya trae punto: al encadenar frases salían dos
  function sinPunto(t) {
    return (t || '').replace(/\.\s*$/, '');
  }

  function ficha(t) {
    var precio = t.p ? '<strong>' + t.p + ' €</strong>' : '<em>precio por confirmar</em>';
    var dur = t.dur ? ' · ' + sinPunto(t.dur) : '';
    return '<a class="chat-ficha" href="' + t.s + '.html">' +
      '<span class="chat-ficha-n">' + esc(t.n) + '</span>' +
      '<span class="chat-ficha-m">' + precio + dur + '</span></a>';
  }

  /* ----------------------------------------------------------------------
     Motor de respuesta
     ---------------------------------------------------------------------- */
  // "tinte de cejas" y "tinte cejas" son lo mismo: fuera los enlaces
  var ENLACES = /\b(?:de|del|la|el|los|las|y|con|para|un|una|mi|mis)\b/g;
  function sinEnlaces(t) {
    return normalizar(t).replace(ENLACES, ' ').replace(/\s+/g, ' ').trim();
  }

  function detectarTratamiento(q) {
    var n = sinEnlaces(q), mejor = null, punt = 0;
    kb.tratamientos.forEach(function (t) {
      var s = solapa(q, t.n) * 1.6;
      (ALIAS[t.s] || []).forEach(function (a0) {
        var a = sinEnlaces(a0);
        // Cuanto más específico es el alias, más manda:
        // «depilación láser» debe ganar a «depilación» a secas.
        if (n.indexOf(a) !== -1) s = Math.max(s, 2 + a.length / 40);
        s = Math.max(s, solapa(q, a) * 1.4);
      });
      if (s > punt) { punt = s; mejor = t; }
    });
    return punt >= 1.0 ? mejor : null;
  }

  function tieneAlguna(q, lista) {
    var n = normalizar(q);
    return lista.some(function (p) { return n.indexOf(normalizar(p)) !== -1; });
  }

  function responder(q) {
    var n = normalizar(q);

    // 1. Salud y casos personales: siempre a Marta
    if (tieneAlguna(q, CLINICO)) {
      return {
        html: '<p>Esto prefiero no contestártelo yo. Cualquier cosa que tenga que ver con tu salud, ' +
          'medicación o situación personal la tiene que valorar <strong>Marta</strong> antes de tocarte la piel, ' +
          'y con la información delante.</p>' +
          '<p>Escríbele y te responde ella misma. Es lo más serio que puedo hacer.</p>' +
          enlaceWA('Hola Marta, tengo una consulta antes de reservar: ' + q)
      };
    }

    // 2. Saludos
    if (/^(hola|buenas|buenos dias|buenas tardes|hey|holi)/.test(n) && n.length < 30) {
      return { html: '<p>¡Hola! Cuéntame qué te ronda: un tratamiento, un precio, el horario… lo que necesites.</p>', chips: true };
    }
    if (/(gracias|genial|perfecto|vale|ok)/.test(n) && n.length < 22) {
      return { html: '<p>A ti. Si te queda cualquier otra duda, aquí sigo.</p>' };
    }

    var t = detectarTratamiento(q);

    // 3. Precio
    var preguntaDuracion = /(dura|duracion|tarda|cuanto tiempo|minutos|se alarga)/.test(n) && !/horario|abre|cierra/.test(n);
    if (!preguntaDuracion && /(precio|precios|cuesta|cuestan|vale|valen|tarifa|coste|caro|barato|cuanto)/.test(n)) {
      if (t) {
        if (t.p) {
          return {
            html: '<p><strong>' + esc(t.n) + '</strong> cuesta <strong>' + t.p + ' €</strong> por sesión' +
              (t.dur ? ', y dura ' + esc(sinPunto(t.dur)) : '') + '.</p>' + ficha(t)
          };
        }
        return {
          html: '<p>El precio de <strong>' + esc(t.n) + '</strong> aún no lo tengo cerrado, y prefiero no decirte una cifra a ojo.</p>' +
            '<p>Marta te lo dice al momento:</p>' + enlaceWA('Hola, ¿cuánto cuesta ' + t.n + '?', 'Preguntar el precio')
        };
      }
      var conPrecio = kb.tratamientos.filter(function (x) { return x.p; })
        .sort(function (a, b) { return a.p - b.p; });
      return {
        html: '<p>Depende del tratamiento. Estos son los que tienen precio cerrado:</p>' +
          '<ul class="chat-precios">' + conPrecio.map(function (x) {
            return '<li><a href="' + x.s + '.html">' + esc(x.n) + '</a><span>' + x.p + ' €</span></li>';
          }).join('') + '</ul>' +
          '<p>Del resto puedes preguntarme por uno concreto, o consultarlo con Marta.</p>'
      };
    }

    // 4. Duración
    if (preguntaDuracion || (/(tiempo|rato)/.test(n) && !/horario|abre|cierra/.test(n))) {
      if (t && t.dur) {
        return {
          html: '<p><strong>' + esc(t.n) + '</strong> dura <strong>' + esc(t.dur) + '</strong>' +
            (t.zona ? ', y se trabaja sobre ' + esc(t.zona).toLowerCase() : '') + '.</p>' + ficha(t)
        };
      }
      return {
        html: '<p>Va de 20 minutos a dos horas según el tratamiento. Dime cuál te interesa y te lo concreto.</p>',
        chips: true
      };
    }

    // 5. Horario
    if (/(horario|abre|abren|abierto|cierra|cierran|cerrado|domingo|sabado|festivo|hoy)/.test(n)) {
      return {
        html: '<p>Este es el horario:</p><ul class="chat-horario">' +
          kb.centro.horario.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') +
          '</ul><p>Siempre con cita previa: así te dedicamos la sesión entera sin solapar a nadie.</p>' +
          enlaceWA('Hola, quisiera consultar disponibilidad de cita.', 'Consultar disponibilidad')
      };
    }

    // 6. Dónde está
    if (/(donde|direccion|sitio|ubicacion|llegar|calle|zaragoza|estais|mapa)/.test(n)) {
      return {
        html: '<p>Estamos en <strong>' + esc(kb.centro.direccion) + '</strong>, en el ' +
          esc(kb.centro.barrio) + '.</p>' +
          '<a class="chat-wa chat-wa--mapa" href="' + kb.centro.maps + '" target="_blank" rel="noopener">Abrir en Google Maps</a>'
      };
    }

    // 7. Reservar
    if (/(reservar|reserva|cita|pedir hora|hueco|disponibilidad|apuntar)/.test(n)) {
      var msg = t ? 'Hola, me gustaría reservar cita para ' + t.n + '.'
                  : 'Hola, me gustaría reservar cita en MAVIÈ Studio.';
      return {
        html: '<p>Las citas se llevan por WhatsApp, hablando directamente con Marta. ' +
          (t ? 'Te dejo el mensaje ya escrito para <strong>' + esc(t.n) + '</strong>:' : 'Te dejo el mensaje preparado:') + '</p>' +
          enlaceWA(msg, 'Reservar por WhatsApp') + (t ? ficha(t) : '')
      };
    }

    // 8. Cosas que no constan
    for (var clave in NO_CONSTA) {
      if (!Object.prototype.hasOwnProperty.call(NO_CONSTA, clave)) continue;
      if (tieneAlguna(q, NO_CONSTA[clave])) {
        return {
          html: '<p>Pues mira, eso no lo tengo confirmado y no te lo voy a inventar.</p>' +
            '<p>Marta te lo aclara en un momento:</p>' +
            enlaceWA('Hola, una duda: ' + q)
        };
      }
    }

    // 9. Cuidados posteriores
    if (t && /(despues|luego|posterior|cuidados|que hago|puedo mojarme|mantener el resultado)/.test(n) && t.cui.length) {
      return {
        html: '<p>Después de <strong>' + esc(t.n) + '</strong>, esto es lo que recomendamos:</p>' +
          '<ul class="chat-lista">' + t.cui.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' + ficha(t)
      };
    }

    // 10. En qué consiste / para quién
    if (t && /(consiste|que es|en que|como es|como funciona|para quien|sirve|recomendable|recomienda|recomiendas|beneficio|va bien|me viene bien|mejor)/.test(n)) {
      var cuerpo = '<p><strong>' + esc(t.n) + '</strong>. ' + esc(t.sub) + '</p>';
      if (t.consiste) cuerpo += '<p>' + esc(t.consiste) + '</p>';
      if (t.quien) cuerpo += '<p class="chat-nota">Va bien para: ' + esc(t.quien) + '</p>';
      return { html: cuerpo + ficha(t) };
    }

    // 11. Preguntas frecuentes de las fichas
    var mejorFaq = null, puntFaq = 0;
    kb.faqs.forEach(function (f) {
      var s = solapa(q, f.q);
      if (t && f.s === t.s) s += 0.35;
      if (s > puntFaq) { puntFaq = s; mejorFaq = f; }
    });
    if (mejorFaq && puntFaq >= 0.52) {
      var tr = kb.tratamientos.filter(function (x) { return x.s === mejorFaq.s; })[0];
      return {
        html: '<p>' + esc(mejorFaq.a) + '</p>' +
          '<p class="chat-nota">Sobre <strong>' + esc(mejorFaq.n) + '</strong></p>' + (tr ? ficha(tr) : '')
      };
    }

    // 12. Se ha entendido el tratamiento pero no la pregunta
    if (t) {
      var suyas = kb.faqs.filter(function (f) { return f.s === t.s; }).slice(0, 3);
      return {
        html: '<p>De <strong>' + esc(t.n) + '</strong> te puedo contar esto:</p>' +
          '<p>' + (t.p ? 'Cuesta <strong>' + t.p + ' €</strong>' : 'Precio por confirmar') +
          (t.dur ? ' y dura ' + esc(sinPunto(t.dur)) : '') + '. ' + esc(t.sub) + '</p>' + ficha(t) +
          (suyas.length ? '<p class="chat-nota">Lo que más se pregunta:</p><div class="chat-chips">' +
            suyas.map(function (f) { return '<button type="button" class="chat-chip" data-q="' + esc(f.q) + '">' + esc(f.q) + '</button>'; }).join('') +
            '</div>' : '')
      };
    }

    // 13. No se ha entendido
    return {
      html: '<p>Esa no te la sé responder con lo que tengo, y prefiero decírtelo a soltarte cualquier cosa.</p>' +
        '<p>Pregúntame por un tratamiento, un precio, el horario o cómo llegar. Y si es algo tuyo en concreto, ' +
        'Marta te contesta mejor que yo:</p>' + enlaceWA('Hola, tengo una duda: ' + q),
      chips: true
    };
  }

  /* ----------------------------------------------------------------------
     Interfaz
     ---------------------------------------------------------------------- */
  var SUGERENCIAS = [
    '¿Cuánto cuesta la manicura rusa?',
    '¿Qué horario tenéis?',
    '¿Cuánto dura el lifting de pestañas?',
    '¿Dónde estáis?',
    'Quiero reservar cita'
  ];

  function pinta(quien, html) {
    var li = document.createElement('div');
    li.className = 'chat-msg chat-msg--' + quien;
    li.innerHTML = html;
    lista.appendChild(li);
    lista.scrollTop = lista.scrollHeight;
    return li;
  }

  function chips() {
    return '<div class="chat-chips">' + SUGERENCIAS.map(function (s) {
      return '<button type="button" class="chat-chip" data-q="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('') + '</div>';
  }

  function escribiendo() {
    var li = pinta('bot', '<span class="chat-typing"><i></i><i></i><i></i></span>');
    li.classList.add('is-typing');
    return li;
  }

  function preguntar(q) {
    q = (q || '').trim();
    if (!q) return;
    pinta('yo', '<p>' + esc(q) + '</p>');
    campo.value = '';

    var t = escribiendo();
    var espera = 380 + Math.min(q.length * 12, 500);
    window.setTimeout(function () {
      var r = responder(q);
      t.remove();
      pinta('bot', r.html + (r.chips ? chips() : ''));
    }, espera);
  }

  function cargarKB(despues) {
    if (kb) return despues();
    if (cargando) return;
    cargando = true;
    var t = escribiendo();
    fetch(RUTA_KB)
      .then(function (r) { return r.json(); })
      .then(function (j) {
        kb = j; cargando = false; t.remove(); despues();
      })
      .catch(function () {
        cargando = false; t.remove();
        pinta('bot', '<p>No he podido cargar la información. Escríbele a Marta y te atiende al momento:</p>' +
          enlaceWA('Hola, quisiera hacer una consulta.'));
      });
  }

  function abrir() {
    panel.hidden = false;
    document.body.classList.add('chat-abierto');
    window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
    fab.setAttribute('aria-expanded', 'true');

    if (!lista.children.length) {
      cargarKB(function () {
        pinta('bot',
          '<p>Hola 👋 Soy el asistente de <strong>MAVIÈ Studio</strong>.</p>' +
          '<p>Te aclaro precios, duraciones, horario y dudas sobre los ' + kb.centro.total + ' tratamientos. ' +
          'No soy Marta: soy automático, así que si la cosa es personal o tiene que ver con tu salud, ' +
          'te paso con ella sin rodeos.</p>' + chips());
      });
    }
    window.setTimeout(function () { campo.focus(); }, 320);
  }

  function cerrar() {
    panel.classList.remove('is-open');
    document.body.classList.remove('chat-abierto');
    fab.setAttribute('aria-expanded', 'false');
    window.setTimeout(function () { panel.hidden = true; }, 280);
    fab.focus();
  }

  /* ----------------------------------------------------------------------
     Arranque
     ---------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    fab = document.querySelector('[data-chat-abrir]');
    panel = document.querySelector('[data-chat-panel]');
    if (!fab || !panel) return;

    lista = panel.querySelector('.chat-lista');
    campo = panel.querySelector('.chat-campo');
    formulario = panel.querySelector('.chat-form');

    fab.addEventListener('click', function () {
      if (panel.hidden) abrir(); else cerrar();
    });

    panel.querySelector('.chat-cerrar').addEventListener('click', cerrar);

    formulario.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = campo.value;
      cargarKB(function () { preguntar(q); });
    });

    lista.addEventListener('click', function (e) {
      var chip = e.target.closest ? e.target.closest('.chat-chip') : null;
      if (!chip) return;
      preguntar(chip.getAttribute('data-q'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) cerrar();
    });
  });
})();
