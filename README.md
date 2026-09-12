# MAVIÈ Studio — Estética y Bienestar (Zaragoza)

Sitio web del centro de estética **MAVIÈ Studio**, en C. del Marqués de la Cadena, 42, Zaragoza.

🔗 **Vista previa:** https://sefiro888.github.io/maviestudio/

---

## Qué es esto

Web estática, sin dependencias ni compilación. Se abre con cualquier servidor de
archivos o subiendo la carpeta a un hosting.

- **38 páginas** — portada, carta de tratamientos, 26 fichas de servicio,
  6 categorías, el estudio, resultados, opiniones y contacto.
- **HTML, CSS y JavaScript planos.** Sin frameworks, sin `npm`, sin build.
- Tipografías desde Google Fonts; todo lo demás es local.

## Estructura

```
├── index.html               Portada
├── tratamientos.html        Carta completa (26 servicios)
├── faciales.html            ┐
├── mirada.html              │
├── manicura-pedicura.html   ├─ Páginas de categoría
├── corporales.html          │
├── depilacion.html          │
├── cosmetica.html           ┘
├── <tratamiento>.html       26 fichas de servicio
├── sobre-mavie.html         El estudio
├── resultados.html          Trabajos reales
├── opiniones.html           Reseñas de Google
├── contacto.html            Ubicación, horario y contacto
└── assets/
    ├── css/
    │   ├── style.css        Sistema de diseño base
    │   └── mavie.css        Capa editorial (se carga después y sobrescribe)
    ├── js/main.js           Comportamiento e interacción
    └── images/
        ├── real/            Fotos reales del estudio
        ├── hero/            Las 6 de la portada, recomprimidas en dos tamaños
        └── ilustracion/     Imágenes creadas que representan el tratamiento
```

La separación entre `real/` e `ilustracion/` es deliberada: permite saber en
todo momento qué imágenes son fotografías del centro y cuáles son
representaciones del tratamiento.

## Cómo verlo en local

```bash
python -m http.server 8000
```

Y abrir <http://localhost:8000>.

## Decisiones que conviene conocer

- **Paleta.** El malva rosado (`#8E6F6C`) está tomado del trazo del logotipo y
  del feed de [@mavie.sttudio](https://www.instagram.com/mavie.sttudio/).
- **Horario en vivo.** El indicador *abierto / cerrado* se calcula en el
  navegador a partir del horario real publicado en Google. Está en
  `assets/js/main.js`, constante `SCHEDULE`.
- **Sin fotos de banco que no correspondan.** Se retiraron 29 imágenes que no
  representaban al centro (entre ellas una consulta dental que figuraba como
  la cabina y una modelo de archivo presentada como la fundadora). Están
  archivadas fuera del repositorio.
- **Sin antes/después inventados.** Solo se publican comparativas reales.
- **Cabecera de la portada.** No hay vídeo del centro, así que la portada
  encadena seis fotografías reales con fundido y un zoom lento. Cada fotograma
  lleva al pie el servicio que muestra, con su precio, y enlaza a su ficha. Las
  imágenes están en `assets/images/hero/` en dos anchos (800 y 1400 px); solo se
  descarga la primera al abrir. La secuencia se detiene con la pestaña oculta o
  el hero fuera de pantalla, y queda fija si el sistema pide movimiento reducido.
  Mientras se ve la cabecera, el `<body>` lleva `hero-inmersivo` y la barra de
  navegación se vuelve transparente sobre la fotografía.

## Pendiente

En espera de que el cliente acepte el presupuesto. Nada de esto está empezado.

**Depende de Marta**

- [ ] Precios de 12 tratamientos (marcados en la web como «a confirmar»):
      manicura express, manicura sin esmalte, laminado de cejas, tinte de cejas,
      maderoterapia 30 min y 1 h, depilación con cera, depilación láser, facial
      acné, facial vitamina C, facial detox y Essential Care Prebiotic
- [ ] Pares de fotos antes/después reales para restaurar el comparador
      (el código está hecho y esperando material)
- [ ] Datos fiscales (nombre, NIF y domicilio) para redactar los textos legales
- [ ] Precios de packs y bonos, si quiere ofrecerlos
- [ ] Enlazar la web desde la ficha de Google Business

**Trabajo por hacer**

- [ ] Aviso legal, política de privacidad y aviso de cookies. Obligatorios por
      LSSI-CE y RGPD; la web incrusta un mapa de Google que instala cookies.
      **Esto tiene que estar antes de que la web sea la oficial, no después.**
- [ ] Sección de packs y tratamientos combinados
- [ ] Datos estructurados de servicio y de preguntas frecuentes, para que Google
      muestre precios y respuestas directamente en los resultados
- [ ] Página 404
- [ ] Imágenes en WebP con `srcset` en el resto del sitio (la cabecera ya lo usa)
- [ ] Quitar la marca duplicada en algunos `<title>`
- [ ] Cabecera en vídeo, si Marta llega a grabar o a animar las fotos
