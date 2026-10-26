// La Caña Vermutería · demo
import { initKit } from '../kit/kit.js?v=3';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = document.documentElement;
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esCelu = () => innerWidth < 768;
const TZ = 'America/Argentina/Buenos_Aires';

// ====================================================================
// 1. Intro: espera fuentes + foto del hero (máx. 2,6 s) y se despega
// ====================================================================
const t0 = performance.now();
function abrirSitio() {
  if (html.classList.contains('listo')) return;
  html.classList.add('intro-fin', 'listo');
  $$('.hero .descubre').forEach(el => el.classList.add('visto'));
  setTimeout(() => html.classList.add('intro-oculta'), 900);
}
if (html.classList.contains('con-intro')) {
  const minimo = esCelu() ? 1350 : 2000;
  const heroImg = $('.hero__principal img');
  const esperas = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    heroImg && !heroImg.complete ? new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : Promise.resolve(),
  ];
  const tope = new Promise(r => setTimeout(r, esCelu() ? 1800 : 2600));
  Promise.race([Promise.all(esperas), tope]).then(() => {
    const falta = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(abrirSitio, falta);
  });
} else {
  requestAnimationFrame(abrirSitio);
}

// ====================================================================
// 2. Barra, menú y navegación
// ====================================================================
const barra = $('[data-barra]');
let ticking = false, yAnt = scrollY;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    barra.classList.toggle('scrolleada', y > 12); html.classList.toggle('paso-hero', y > innerHeight * .55);
    // en el celu la píldora del panel se esconde mientras bajás y vuelve al subir (no tapa precios ni botones)
    if (Math.abs(y - yAnt) > 6) { html.classList.toggle('baja', y > yAnt); yAnt = y; }
    ticking = false;
  });
}, { passive: true });

const menu = $('[data-menu]');
const btnMenu = $('[data-menu-abrir]');
let scrollGuardado = 0;
function bloquearScroll(si) {
  // iPhone: fijar el body y devolver el scroll al cerrar
  if (si) { scrollGuardado = scrollY; Object.assign(document.body.style, { position: 'fixed', top: `-${scrollGuardado}px`, left: '0', right: '0' }); }
  else { Object.assign(document.body.style, { position: '', top: '', left: '', right: '' }); scrollTo({ top: scrollGuardado, behavior: 'instant' }); }
}
function abrirMenu() { menu.hidden = false; menu.classList.remove('cerrando'); btnMenu.setAttribute('aria-expanded', 'true'); bloquearScroll(true); setTimeout(() => $('.menu__x', menu).focus(), 50); }
function cerrarMenu(destino) {
  if (menu.hidden) return;
  menu.classList.add('cerrando'); btnMenu.setAttribute('aria-expanded', 'false');
  setTimeout(() => { menu.hidden = true; menu.classList.remove('cerrando'); bloquearScroll(false); if (destino) $(destino)?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth' }); else btnMenu.focus(); }, 230);
}
btnMenu.addEventListener('click', abrirMenu);
$('[data-menu-cerrar]').addEventListener('click', () => cerrarMenu());
menu.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (a) { e.preventDefault(); cerrarMenu(a.getAttribute('href')); } });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });

// sección activa en la barra (desktop)
const links = $$('.barra__nav a');
const ioNav = new IntersectionObserver((ents) => ents.forEach(en => {
  if (en.isIntersecting) links.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['carta', 'vermu', 'reservar', 'llevar', 'lugar', 'donde'].forEach(id => { const s = document.getElementById(id); if (s) ioNav.observe(s); });

// ====================================================================
// 3. Entradas al hacer scroll + guirnaldas
// ====================================================================
const io = new IntersectionObserver((ents) => ents.forEach(en => {
  if (!en.isIntersecting) return;
  const el = en.target; io.unobserve(el);
  if (el.matches('[data-guirnalda]')) return el.classList.add('prendida');
  // las fotos se descubren recién cuando ya cargaron (así no se “destapa” un hueco vacío)
  const img = el.matches('.descubre') && el.querySelector('img');
  if (img && !img.complete) { const listo = () => el.classList.add('visto'); img.addEventListener('load', listo, { once: true }); img.addEventListener('error', listo, { once: true }); img.loading = 'eager'; }
  else el.classList.add('visto');
}), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
// precarga: las fotos que se van a descubrir empiezan a bajar un poco antes de entrar
const ioPre = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) { const i = en.target.querySelector('img'); if (i) i.loading = 'eager'; ioPre.unobserve(en.target); } }), { rootMargin: '600px 0px' });
$$('.descubre').forEach(el => ioPre.observe(el));
$$('.entra, .descubre').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

function armarGuirnalda(el) {
  const w = 1440, n = 22, pts = [];
  let d = 'M0 6';
  for (let i = 0; i < n; i++) {
    const x0 = (i / n) * w, x1 = ((i + 1) / n) * w, xm = (x0 + x1) / 2;
    d += ` Q${xm} ${i % 2 ? 22 : 30} ${x1} 6`;
    pts.push([xm, i % 2 ? 15 : 19]);
  }
  el.innerHTML = `<svg viewBox="0 0 ${w} 54" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#8f826a" stroke-width="1.4" vector-effect="non-scaling-stroke"/>${pts.map(([x, y], i) => `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y}" stroke="#8f826a" stroke-width="1.4" vector-effect="non-scaling-stroke"/><circle style="--i:${i}" cx="${x}" cy="${y + 6}" r="5.5"/>`).join('')}</svg>`;
  io.observe(el);
}
$$('[data-guirnalda]').forEach(armarGuirnalda);

// ====================================================================
// 4. Hora real del local
// ====================================================================
const HORARIOS = { 0: [13 * 60, 24 * 60], 1: null, 2: [13 * 60, 24 * 60], 3: [13 * 60, 24 * 60], 4: [13 * 60, 24 * 60], 5: [13 * 60, 25 * 60], 6: [13 * 60, 25 * 60] };
const DIAS_N = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function ahoraBA() {
  const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(x => p[x.type] = x.value);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dow, min: Number(p.hour) * 60 + Number(p.minute), hh: p.hour, mm: p.minute };
}
// devuelve el estado considerando la franja de ayer que cruza la medianoche
function estadoLocal(a = ahoraBA()) {
  const hoy = HORARIOS[a.dow], ayer = HORARIOS[(a.dow + 6) % 7];
  if (ayer && ayer[1] > 1440 && a.min < ayer[1] - 1440) return { abierto: true, min: a.min + 1440, dow: (a.dow + 6) % 7, cierra: ayer[1] };
  if (hoy && a.min >= hoy[0] && a.min < hoy[1]) return { abierto: true, min: a.min, dow: a.dow, cierra: hoy[1] };
  // próxima apertura
  for (let k = 0; k < 7; k++) {
    const d = (a.dow + k) % 7, h = HORARIOS[d];
    if (h && (k > 0 || a.min < h[0])) return { abierto: false, abreDow: d, abreHoy: k === 0, abreManana: k === 1, abre: h[0] };
  }
  return { abierto: false };
}
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function textoEstado(e = estadoLocal()) {
  if (e.abierto) return `Abierto ahora · cerramos a las ${hhmm(e.cierra)}`;
  if (e.abreHoy) return `Cerrado ahora · hoy abrimos a las ${hhmm(e.abre)}`;
  if (e.abreManana) return `Hoy descansamos · mañana abrimos a las ${hhmm(e.abre)}`;
  return `Cerrado · abrimos el ${DIAS_N[e.abreDow]} a las ${hhmm(e.abre)}`;
}
function pintarEstado() {
  const e = estadoLocal();
  $$('[data-estado-txt]').forEach(el => el.textContent = textoEstado(e));
  $$('[data-estado-punto]').forEach(el => el.classList.toggle('abierto', !!e.abierto));
  const hoy = $(`.horario tr[data-dia="${ahoraBA().dow}"]`); $$('.horario tr').forEach(tr => tr.classList.toggle('hoy', tr === hoy));
}
pintarEstado(); setInterval(pintarEstado, 60000);

// ====================================================================
// 5. WOW A · El reloj del vermú
// ====================================================================
const MOMENTOS = {
  mediodia: { img: 'img/momento-dia.webp', alt: 'La vereda de La Caña de día, con sombrillas rojas', t: 'Arranca el vermú del mediodía', p: 'Vermú de grifo con soda, una tortilla recién hecha y la vereda de Marcos Sastre.', cta: 'Reservá para el mediodía', hora: '13:00' },
  '2x1': { img: 'img/momento-2x1.webp', alt: 'Un trago largo en la barra, con las lámparas prendidas', t: '2x1 en tragos clásicos', p: 'De 18 a 21: Negroni, Americano, Garibaldi, Fernet, Aperol, Gin tonic y el resto de la coctelería clásica, de a dos.', cta: 'Reservá para el 2x1', hora: '19:00' },
  noche: { img: 'img/momento-noche.webp', alt: 'La esquina de noche con la guirnalda prendida y las mesas llenas', t: 'La esquina prendida', p: 'Se prende la guirnalda: pinchos, platitos y coctelería de autor hasta la medianoche (viernes y sábado, hasta la 1).', cta: 'Reservá para la noche', hora: '20:30' },
  cerrado: { img: 'img/momento-noche.webp', alt: 'La esquina de noche', t: 'Hoy descansamos', p: '', cta: 'Reservá tu mesa', hora: null },
};
const reloj = $('[data-reloj]');
const forzado = new URLSearchParams(location.search).get('momento');
function momentoReal() {
  if (forzado && MOMENTOS[forzado]) return forzado;
  const e = estadoLocal();
  if (!e.abierto) return 'cerrado';
  return e.min < 18 * 60 ? 'mediodia' : e.min < 21 * 60 ? '2x1' : 'noche';
}
let momentoVisto = null;
function pintarReloj(m = momentoReal(), preview = false) {
  const real = momentoReal(), d = MOMENTOS[m], a = ahoraBA(), e = estadoLocal();
  const img = $('[data-reloj-img]', reloj);
  if (momentoVisto !== m) {
    img.classList.add('cambia');
    setTimeout(() => { img.src = d.img; img.alt = d.alt; img.onload = () => img.classList.remove('cambia'); if (img.complete) img.classList.remove('cambia'); }, momentoVisto ? 220 : 0);
  }
  momentoVisto = m;
  $('[data-reloj-t]', reloj).textContent = m === 'cerrado' && e.abreHoy ? 'Todavía no abrimos' : d.t;
  const vuelve = e.abierto ? '' : e.abreHoy ? `Hoy abrimos a las ${hhmm(e.abre)}.` : e.abreManana ? `Mañana abrimos a las ${hhmm(e.abre)}.` : `Volvemos el ${DIAS_N[e.abreDow]} a las ${hhmm(e.abre ?? 780)}.`;
  $('[data-reloj-p]', reloj).textContent = m === 'cerrado' ? `${vuelve || 'Volvemos a las 13.'} Mientras tanto, dejá tu mesa reservada para cuando quieras.` : d.p;
  $('[data-reloj-hora]', reloj).textContent = preview ? 'así se ve más tarde' : forzado ? 'vista de ejemplo' : `son las ${a.hh}:${a.mm} en la esquina`;
  const cta = $('[data-reloj-cta]', reloj); cta.textContent = d.cta; cta.dataset.hora = d.hora || '';
  $$('[data-momento]', reloj).forEach(b => { b.setAttribute('aria-selected', b.dataset.momento === m); b.classList.toggle('ahora', b.dataset.momento === real); });
  const cuenta = $('[data-reloj-cuenta]', reloj);
  const falta = (hasta) => { const x = Math.max(0, hasta - e.min); return x >= 60 ? `${Math.floor(x / 60)} h ${x % 60} min` : `${x} min`; };
  if (!forzado && !preview && m === '2x1' && e.abierto) { cuenta.hidden = false; cuenta.innerHTML = `El 2x1 termina en <b>${falta(21 * 60)}</b>`; }
  else if (!forzado && !preview && m === 'mediodia' && e.abierto) { cuenta.hidden = false; cuenta.innerHTML = `El 2x1 arranca en <b>${falta(18 * 60)}</b>`; }
  else cuenta.hidden = true;
  $('[data-reloj-nota]', reloj).textContent = preview ? 'Estás viendo otro momento del día.' : 'Lo que ves cambia con la hora real del local.';
}
$$('[data-momento]', reloj).forEach(b => b.addEventListener('click', () => { const m = b.dataset.momento; pintarReloj(m, m !== momentoReal()); }));
pintarReloj(); setInterval(() => { if (!$('[data-reloj-nota]', reloj).textContent.startsWith('Estás')) pintarReloj(); }, 30000);

// ====================================================================
// 6. WOW D · Etiquetas que giran
// ====================================================================
$$('[data-etq]').forEach(etq => {
  const girar = () => { const on = !etq.classList.contains('girada'); etq.classList.toggle('girada', on); etq.setAttribute('aria-pressed', on); etq.style.transform = ''; };
  etq.addEventListener('click', girar);
  etq.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); girar(); } });
  if (matchMedia('(hover: hover) and (min-width: 900px)').matches && !reducido) {
    let raf = 0;
    etq.addEventListener('pointermove', (e) => {
      if (etq.classList.contains('girada')) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const r = etq.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; etq.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg) translateY(-4px)`; });
    });
    etq.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); etq.style.transform = ''; });
  }
});

// ====================================================================
// 7. WOW B · El sifón 70/30
// ====================================================================
(function sifon() {
  const box = $('[data-sifon]'); if (!box) return;
  const btn = $('[data-sifon-btn]', box), soda = $('[data-sifon-soda]', box), msg = $('[data-sifon-msg]', box), cta = $('[data-sifon-cta]', box), vaso = $('[data-sifon-vaso]', box);
  const VERMU = .6, META = .6 / .7 - .6; // soda que completa el 70/30
  let s = 0, sirviendo = false, last = 0, raf = 0, audio = null;
  function sonido(on) {
    try {
      if (on) {
        if (!audio) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = .8;
          const g = ctx.createGain(); g.gain.value = 0;
          src.connect(bp).connect(g).connect(ctx.destination); src.start();
          audio = { ctx, g };
        }
        audio.ctx.resume(); audio.g.gain.setTargetAtTime(.045, audio.ctx.currentTime, .03);
      } else if (audio) audio.g.gain.setTargetAtTime(0, audio.ctx.currentTime, .05);
    } catch (_) { /* sin audio */ }
  }
  function pintar() {
    soda.style.height = `${Math.min(s, 1 - VERMU) * 100}%`;
    $('.sifon__vermu', box).style.filter = `brightness(${1 + s * .5}) saturate(${1 - s * .4})`;
  }
  function mensaje(final) {
    msg.classList.remove('ok'); cta.hidden = true;
    if (s >= 1 - VERMU - .005) { msg.textContent = 'Uy, eso ya es un vaso de soda. ¡Otro vaso!'; return; }
    if (s > META + .045) { msg.textContent = 'Se te fue un poco la mano con la soda…'; return; }
    if (s >= META - .03) { msg.textContent = '¡Así lo servimos! 70/30, con hielo y pomelo.'; msg.classList.add('ok'); if (final) cta.hidden = false; return; }
    msg.textContent = s > .02 ? 'Un poquito más de soda…' : 'Mantené apretado el sifón para la soda.';
  }
  function paso(ts) {
    if (!sirviendo) return;
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    s = Math.min(1 - VERMU, s + dt * .13);
    pintar(); mensaje(false);
    if (s >= 1 - VERMU) return parar();
    raf = requestAnimationFrame(paso);
  }
  function servir(e) {
    if (e) e.preventDefault();
    if (sirviendo) return; sirviendo = true; last = 0; box.classList.add('sirviendo'); sonido(true);
    raf = requestAnimationFrame(paso);
  }
  function parar() { if (!sirviendo) return; sirviendo = false; cancelAnimationFrame(raf); box.classList.remove('sirviendo'); sonido(false); mensaje(true); }
  btn.addEventListener('pointerdown', (e) => { btn.setPointerCapture?.(e.pointerId); servir(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, parar));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) servir(e); });
  btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') parar(); });
  // con el mouse: la rueda sobre el vaso también sirve
  vaso.addEventListener('wheel', (e) => { e.preventDefault(); s = Math.min(1 - VERMU, Math.max(0, s + Math.abs(e.deltaY) * .0006)); pintar(); clearTimeout(vaso._t); vaso._t = setTimeout(() => mensaje(true), 250); mensaje(false); }, { passive: false });
  $('[data-sifon-reset]', box).addEventListener('click', () => { s = 0; pintar(); mensaje(false); });
  pintar();
})();

// ====================================================================
// 8. Galería: arrastre fluido con el mouse cuando es carrusel
// ====================================================================
(function galeria() {
  const pista = $('[data-pista]'); if (!pista) return;
  let x0 = 0, s0 = 0, arrastrando = false, movido = 0, v = 0, lastX = 0, lastT = 0, raf = 0;
  const esCarrusel = () => pista.scrollWidth > pista.clientWidth + 4;
  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || !esCarrusel()) return;
    arrastrando = true; movido = 0; x0 = lastX = e.clientX; s0 = pista.scrollLeft; lastT = performance.now(); v = 0; cancelAnimationFrame(raf);
    pista.setPointerCapture(e.pointerId); pista.classList.add('arrastrando');
  });
  pista.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    const dx = e.clientX - x0; movido = Math.max(movido, Math.abs(dx)); pista.scrollLeft = s0 - dx;
    const t = performance.now(); v = (e.clientX - lastX) / Math.max(1, t - lastT); lastX = e.clientX; lastT = t;
  });
  const soltar = () => {
    if (!arrastrando) return; arrastrando = false;
    let vel = -v * 16;
    const inercia = () => { pista.scrollLeft += vel; vel *= .92; if (Math.abs(vel) > .5) raf = requestAnimationFrame(inercia); else pista.classList.remove('arrastrando'); };
    raf = requestAnimationFrame(inercia);
  };
  pista.addEventListener('pointerup', soltar); pista.addEventListener('pointercancel', soltar);
  pista.addEventListener('click', (e) => { if (movido > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  $$('[data-gal]').forEach(b => b.addEventListener('click', () => pista.scrollBy({ left: Number(b.dataset.gal) * pista.clientWidth * .8, behavior: 'smooth' })));
})();

// ====================================================================
// 9. Kit: carta, reservas, para llevar y panel
// ====================================================================
const LLEVABLES = new Set(['hora-vermut', 'pinchos-mar', 'pinchos-tierra', 'platitos', 'tortilla', 'tapeo', 'postres', 'vermut', 'sidra-birra',
  'inv-entradas', 'inv-platitos', 'inv-tortillas', 'inv-sandwiches', 'inv-contundentes', 'inv-postres']);
const NOTAS = {
  'pinchos-mar': 'Sobre pan tostado. Se piden de a uno.', 'pinchos-tierra': 'Sobre pan tostado. Se piden de a uno.',
  tapeo: 'Tablas para compartir y el triolet para la hora del vermú.', vermut: 'Rosso de grifo, elaborado artesanalmente.',
  cocteleria: '2x1 en los clásicos de 18 a 21.', autor: 'Con nuestro vermú La Caña.', 'sidra-birra': 'Consultá los sabores de la birra.',
};
const FOTO_DEF = { cocina: 'img/carta/croquetas.webp', barra: 'img/carta/vermu-servido.webp' };

let kit;
try {
  kit = await initKit({
    config: 'cliente.json',
    carta: {
      itemClass: 'it',
      etiquetas: { veggie: { label: 'Sin carne' }, casa: { label: 'De la casa' } },
      template: (p, ctx) => {
        const precio = ctx.money(p.precio);
        const tags = (p.etiquetas || []).filter(t => t === 'veggie').map(t => ctx.etiquetaHTML(t)).join('');
        const lleva = ctx.carrito && LLEVABLES.has(p.categoria) && p.precio != null && p.disponible !== false;
        return `${p.foto ? `<img class="it__mini" src="${esc(ctx.asset(p.foto))}" alt="" width="60" height="60" loading="lazy" decoding="async">` : ''}
          <div class="it__main"><h4 class="it__n">${p.foto ? '<span class="it__foto-dot" aria-hidden="true"></span>' : ''}${esc(p.nombre)}${tags}</h4>${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}</div>
          <div class="it__lado">${precio ? `<span class="it__p">${precio}</span>` : '<span class="it__p it__p--na">Consultar</span>'}${p.disponible === false ? '<span class="kit-badge kit-badge--off">Sin stock hoy</span>' : ''}${lleva ? `<div data-kit-qty="${esc(p.id)}"></div>` : ''}</div>`;
      },
    },
    carrito: { label: 'Para llevar' },
    badge: true,
  });
} catch (err) { console.error('[demo] kit', err); }

if (kit) {
  // estado del local también según el kit (por si el dueño cambia horarios en cliente.json)
  window.laCana = { kit };

  // ---------- botones "Reservar" → popup del kit
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reservar], [data-reloj-cta]'); if (!b || !kit.reservas) return;
    e.preventDefault();
    const hora = b.dataset.hora;
    const hoy = kit.reservas.dias().find(d => d.offset === 0 && d.abierto);
    kit.reservas.abrir(hora && hoy && momentoReal() !== 'cerrado' ? { fecha: hoy.fecha, hora } : {});
  });

  // ---------- carta: Cocina / Barra, una sección por vez
  const cartaEl = $('[data-kit="carta"]');
  const nav = $('[data-carta-nav]'), secsBox = $('[data-secs]'), headSec = $('[data-sec-head]'), pasos = $('[data-pasos]');
  const fotoBox = $('[data-carta-foto]'), fotoImg = $('[data-carta-foto-img]'), fotoTxt = $('[data-carta-foto-txt]');
  const temps = kit.config.carta?.temporadas || [];
  let grupo = 'cocina', cats = [], prods = [];
  const grupoDe = (c) => (c.temporada ? 'cocina' : 'barra');
  const catActual = () => $('.kit-tab.is-on', cartaEl)?.dataset.cat;
  function irA(id, { scroll = false } = {}) {
    const tab = $(`.kit-tab[data-cat="${CSS.escape(id)}"]`, cartaEl); if (!tab) return;
    tab.click(); pintarNav();
    if (scroll) {
      const top = $('.carta__cuerpo').getBoundingClientRect().top + scrollY - (esCelu() ? 190 : 110);
      if (scrollY > top) scrollTo({ top, behavior: reducido ? 'auto' : 'smooth' });
    }
  }
  function pintarNav() {
    const actual = catActual(); const c = cats.find(x => x.id === actual);
    if (c) grupo = grupoDe(c);
    $$('[data-grupo]', nav).forEach(b => b.setAttribute('aria-pressed', b.dataset.grupo === grupo));
    const lista = cats.filter(x => grupoDe(x) === grupo);
    secsBox.innerHTML = lista.map(x => `<button type="button" role="tab" aria-selected="${x.id === actual}" data-ir="${esc(x.id)}">${esc(x.nombre)}<small>${prods.filter(p => p.categoria === x.id).length}</small></button>`).join('');
    const on = $('[aria-selected="true"]', secsBox); if (on && esCelu()) secsBox.scrollTo({ left: on.offsetLeft - 8, behavior: reducido ? 'auto' : 'smooth' });
    if (c) {
      const n = prods.filter(p => p.categoria === c.id).length;
      headSec.innerHTML = `<h3>${esc(c.nombre)}</h3><p>${n} ${n === 1 ? 'opción' : 'opciones'}${NOTAS[c.id] ? ' · ' + esc(NOTAS[c.id]) : ''}${kit.carrito && LLEVABLES.has(c.id) ? ' · También para llevar.' : ''}</p>`;
      headSec.classList.remove('entra-sec'); void headSec.offsetWidth; headSec.classList.add('entra-sec');
      const i = lista.findIndex(x => x.id === c.id);
      const [ant, sig] = [lista[i - 1], lista[i + 1]];
      const [bA, bS] = $$('[data-paso]', pasos);
      bA.disabled = !ant; bA.textContent = ant ? `← ${ant.nombre}` : '←'; bA.dataset.ir = ant?.id || '';
      bS.disabled = !sig; bS.textContent = sig ? `${sig.nombre} →` : '→'; bS.dataset.ir = sig?.id || '';
      // foto por defecto: el primer plato con foto de la sección
      const conFoto = prods.find(p => p.categoria === c.id && p.foto);
      ponerFoto(conFoto ? kit.asset(conFoto.foto) : FOTO_DEF[grupo], conFoto ? conFoto.nombre : '', conFoto ? '' : 'Pasá el mouse por los platos con punto verde.');
    }
  }
  function ponerFoto(src, nombre, txt) {
    if (!fotoImg) return;
    if (!fotoImg.src.endsWith(src.replace(/^.*\//, ''))) { fotoImg.classList.add('cambia'); const im = new Image(); im.onload = () => { fotoImg.src = src; fotoImg.classList.remove('cambia'); }; im.src = src; }
    fotoTxt.innerHTML = nombre ? `<b>${esc(nombre)}</b>Pasá el mouse por los platos con punto verde.` : esc(txt);
  }
  nav.addEventListener('click', (e) => {
    const g = e.target.closest('[data-grupo]');
    if (g && g.dataset.grupo !== grupo) { grupo = g.dataset.grupo; const first = cats.find(x => grupoDe(x) === grupo); if (first) irA(first.id); return; }
    const s = e.target.closest('[data-ir]'); if (s) irA(s.dataset.ir);
  });
  pasos.addEventListener('click', (e) => { const b = e.target.closest('[data-paso]'); if (b?.dataset.ir) irA(b.dataset.ir, { scroll: true }); });
  // foto del plato al pasar el mouse (desktop)
  let rafFoto = 0;
  cartaEl.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const it = e.target.closest('.kit-item'); if (!it) return;
    cancelAnimationFrame(rafFoto);
    rafFoto = requestAnimationFrame(() => {
      $$('.kit-item.foco', cartaEl).forEach(x => x !== it && x.classList.remove('foco')); it.classList.add('foco');
      if (it.dataset.photo) ponerFoto(it.dataset.photo, $('.it__n', it)?.textContent.trim(), '');
    });
  });
  document.addEventListener('kit:carta', (e) => {
    if (e.detail.el !== cartaEl) return;
    prods = e.detail.productos;
    cats = e.detail.categorias.filter(c => e.detail.productos.some(p => p.categoria === c.id));
    const t = temps.find(x => x.id === e.detail.temporada);
    $('[data-temp-nombre]').textContent = t ? `de ${t.nombre.toLowerCase()}` : '';
    // si la sección elegida no es del grupo, mostrar la primera del grupo actual
    const c = cats.find(x => x.id === catActual());
    if (c && grupoDe(c) !== grupo) { const first = cats.find(x => grupoDe(x) === grupo); if (first) { irA(first.id); return; } }
    pintarNav();
  });

  // ---------- para llevar
  const llevarEl = $('[data-llevar]');
  const IDS_LLEVAR = ['botellin', 'botella-soda', 'tortilla-crudo', 'croq-jamon', 'gambas', 'tortilla-hongos'];
  async function pintarLlevar() {
    if (!kit.carrito) { $('#llevar')?.setAttribute('hidden', ''); return; }
    const ps = await kit.store.getProductos();
    const lista = IDS_LLEVAR.map(id => ps.find(p => p.id === id)).filter(p => p && p.precio != null && p.disponible !== false);
    llevarEl.innerHTML = lista.map(p => `<li>${p.foto ? `<img src="${esc(kit.asset(p.foto))}" alt="" width="56" height="56" loading="lazy" decoding="async">` : '<span></span>'}<div><b>${esc(p.nombre)}</b><span>${kit.money(p.precio)}</span></div><div data-kit-qty="${esc(p.id)}"></div></li>`).join('');
    kit.carrito.sync(llevarEl); kit.carrito.sync($('[data-formatos]'));
  }
  pintarLlevar(); kit.store.onChange(pintarLlevar);
  if (!kit.carrito) $$('.formatos__qty').forEach(x => x.remove());

  // ---------- WOW C · pizarrón de turnos
  const pizarron = $('[data-pizarron]'), diasBox = $('[data-dias]');
  const st = { fecha: null, personas: 2 };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DCORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  function palitos(n, max) {
    const grupos = [], k = Math.min(n, max);
    for (let g = 0; g * 5 < k; g++) {
      const enG = Math.min(5, k - g * 5), x = g * 26;
      let d = ''; for (let i = 0; i < Math.min(4, enG); i++) d += `M${x + 3 + i * 5} 2v14`;
      if (enG === 5) d += `M${x} 13L${x + 22} 5`;
      grupos.push(d);
    }
    return `<svg class="turno__palitos" viewBox="0 0 ${Math.max(26, grupos.length * 26)} 18" aria-hidden="true" preserveAspectRatio="xMinYMid meet"><path d="${grupos.join('')}"/></svg>`;
  }
  function pintarDias() {
    const dias = kit.reservas.dias().slice(0, 10);
    if (!st.fecha) st.fecha = dias.find(d => d.abierto)?.fecha;
    diasBox.innerHTML = dias.map(d => {
      const [, m, dd] = d.fecha.split('-').map(Number);
      const nom = d.offset === 0 ? 'Hoy' : d.offset === 1 ? 'Mañana' : DCORTO[d.dow];
      return `<button type="button" role="radio" class="dia" data-fecha="${d.fecha}" aria-checked="${d.fecha === st.fecha}" ${d.abierto ? '' : 'disabled'}><b>${nom}</b><small>${d.abierto ? `${dd} ${MESES[m - 1]}` : 'cerrado'}</small></button>`;
    }).join('');
  }
  let pintando = 0;
  async function pintarTurnos(saltar = true) {
    const yo = ++pintando;
    $('[data-pers-n]').textContent = st.personas;
    $('[data-pers="-1"]').disabled = st.personas <= 1; $('[data-pers="1"]').disabled = st.personas >= 8;
    let ts = (await kit.reservas.turnos(st.fecha, st.personas)).filter(t => !t.pasado);
    if (yo !== pintando) return;
    // hoy ya no quedan turnos: saltar al próximo día abierto
    if (saltar && !ts.some(t => t.disponible)) {
      const sig = kit.reservas.dias().find(d => d.abierto && d.fecha > st.fecha);
      if (sig && sig.offset < 7) { st.fecha = sig.fecha; pintarDias(); return pintarTurnos(false); }
    }
    const anot = (() => { try { return JSON.parse(sessionStorage.getItem('lacana:anotado') || 'null'); } catch (_) { return null; } })();
    if (!ts.length) { pizarron.innerHTML = `<p class="turnos__vacio">No quedan turnos para este día.<br>Probá con otro.</p>`; return; }
    const FR = [['Mediodía', t => t.min < 16 * 60, ''], ['Tarde · hora del vermú', t => t.min >= 16 * 60 && t.min < 20 * 60, ''], ['Noche', t => t.min >= 20 * 60, '']];
    let i = 0;
    pizarron.innerHTML = FR.map(([nom, f]) => {
      const lista = ts.filter(f); if (!lista.length) return '';
      return `<div class="franja"><p class="franja__t">${nom}</p><div class="franja__lista">${lista.map(t => {
        const es2x1 = t.min >= 18 * 60 && t.min < 21 * 60;
        const info = !t.disponible ? (t.libres > 0 ? `solo ${t.libres} lugares` : 'completo') : t.libres <= 8 ? `quedan ${t.libres}` : `${t.libres} lugares`;
        return `<button type="button" class="turno${t.disponible && t.libres <= 8 ? ' poco' : ''}" style="--i:${i++}" data-hora="${t.hora}" ${t.disponible ? '' : 'disabled'} aria-label="${t.label}, ${info}">
          ${es2x1 ? '<span class="turno__tag">2x1</span>' : ''}<span class="turno__h">${t.label}</span>${palitos(t.libres, t.capacidad)}<span class="turno__info">${info}</span></button>`;
      }).join('')}</div></div>`;
    }).join('') + (anot && anot.fecha === st.fecha ? `<p class="anotado">Anotado: ${esc(anot.nombre)} x${anot.personas} · ${esc(anot.hora)}</p>` : '');
  }
  diasBox.addEventListener('click', (e) => { const b = e.target.closest('[data-fecha]'); if (!b || b.disabled) return; st.fecha = b.dataset.fecha; $$('.dia', diasBox).forEach(x => x.setAttribute('aria-checked', x === b)); pintarTurnos(false); });
  $$('[data-pers]').forEach(b => b.addEventListener('click', () => { st.personas = Math.max(1, Math.min(8, st.personas + Number(b.dataset.pers))); pintarTurnos(false); }));
  pizarron.addEventListener('click', (e) => { const b = e.target.closest('[data-hora]'); if (b && !b.disabled) kit.reservas.abrir({ fecha: st.fecha, hora: b.dataset.hora, personas: st.personas }); });
  document.addEventListener('kit:reserva', (e) => {
    const r = e.detail; const m = Number(r.hora.split(':')[0]) * 60 + Number(r.hora.split(':')[1]);
    try { sessionStorage.setItem('lacana:anotado', JSON.stringify({ fecha: r.fecha, nombre: r.nombre, personas: r.personas, hora: hhmm(m) })); } catch (_) { /* nada */ }
    st.fecha = r.fecha; pintarDias(); pintarTurnos(false);
  });
  if (kit.reservas) { pintarDias(); pintarTurnos(); kit.store.onChange(() => pintarTurnos(false)); }
} else {
  $('[data-pizarron]').innerHTML = '<p class="turnos__vacio">Para reservar escribinos por WhatsApp.</p>';
}
