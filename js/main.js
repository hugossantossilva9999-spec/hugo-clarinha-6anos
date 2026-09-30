/* ========== HOME ========== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---- Emojis flutuando no hero ---- */
(function floaters(){
  const box = $('#floaters'); if (!box) return;
  const list = ['💍','🏢','💕','🔑','🥂','✨','💖','🏙️','💐'];
  for (let i = 0; i < 16; i++){
    const s = document.createElement('span');
    s.textContent = list[i % list.length];
    s.style.setProperty('--x', (Math.random()*94) + '%');
    s.style.setProperty('--s', (1.1 + Math.random()*1.4) + 'rem');
    s.style.setProperty('--d', (9 + Math.random()*8) + 's');
    s.style.setProperty('--delay', (3 + Math.random()*10) + 's');
    s.style.setProperty('--sway', (Math.random()*60 - 30) + 'px');
    box.appendChild(s);
  }
})();

/* ---- Celebração inicial ---- */
window.addEventListener('load', () => Confetti.celebrate());
$('#btn-boom')?.addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  Confetti.burst(r.left + r.width/2, r.top, 150, 1.1);
  Confetti.cannon(0, innerHeight, 62, 60);
  Confetti.cannon(innerWidth, innerHeight, 118, 60);
  Confetti.rain(4000);
});

/* ---- Contador de tempo juntos ---- */
(function counter(){
  const start = new Date(CONFIG.inicio);
  const wrap = $('#counter'); if (!wrap) return;
  const cells = {};
  [['anos','anos'],['meses','meses'],['dias','dias'],['horas','horas'],['min','minutos'],['seg','segundos']].forEach(([k,l]) => {
    const d = document.createElement('div'); d.className = 'cell';
    d.innerHTML = `<b>0</b><small>${l}</small>`;
    wrap.appendChild(d); cells[k] = d;
  });
  const set = (k, v) => {
    const b = cells[k].firstChild;
    if (b.textContent != v){ b.textContent = v; cells[k].classList.remove('tick'); void cells[k].offsetWidth; cells[k].classList.add('tick'); }
  };
  // soma N meses a uma data, respeitando fim de mês
  const addMonths = (d, n) => { const r = new Date(d), day = r.getDate(); r.setMonth(r.getMonth() + n); if (r.getDate() !== day) r.setDate(0); return r; };
  function update(){
    const now = new Date();
    let total = 0;
    while (addMonths(start, total + 1) <= now) total++;
    const rem = now - addMonths(start, total);
    set('anos', Math.floor(total / 12)); set('meses', total % 12);
    set('dias', Math.floor(rem / 864e5));
    set('horas', Math.floor(rem / 36e5) % 24);
    set('min', Math.floor(rem / 6e4) % 60);
    set('seg', Math.floor(rem / 1e3) % 60);
    $('#total-days').textContent = `${Math.floor((now - start) / 864e5).toLocaleString('pt-BR')} dias de nós dois 💕`;
  }
  update(); setInterval(update, 1000);
})();

/* ---- Cards "agora" ---- */
$$('[data-boom]').forEach(b => b.addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  Confetti.burst(r.left + r.width/2, r.top, 90, .9);
}));

/* ---- Galeria + lightbox ---- */
(function gallery(){
  const grid = $('#grid'); if (!grid) return;
  const lb = $('#lightbox'), lbImg = $('#lb-img'), lbCount = $('#lb-count');
  let idx = 0;
  const pattern = ['tall','','','wide','','tall','','','','wide','tall','','','wide',''];

  CONFIG.fotos.forEach((f, i) => {
    const fig = document.createElement('figure');
    fig.className = 'shot ' + (pattern[i] || '');
    fig.innerHTML = `<img src="${f.src}" alt="Foto ${i + 1}" loading="lazy"><div class="ph"><span>📷</span>${f.src.split('/').pop()}</div>`;
    fig.querySelector('img').addEventListener('error', () => fig.classList.add('missing'));
    fig.addEventListener('click', () => open(i));
    grid.appendChild(fig);
  });

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting){
      const i = $$('.shot', grid).indexOf(e.target);
      setTimeout(() => e.target.classList.add('on'), (i % 2) * 140);
      io.unobserve(e.target);
    }
  }), { threshold: .15 });
  $$('.shot', grid).forEach(s => io.observe(s));

  function show(i){
    idx = (i + CONFIG.fotos.length) % CONFIG.fotos.length;
    const f = CONFIG.fotos[idx];
    lbImg.style.opacity = 1; lbImg.src = f.src; lbImg.alt = 'Foto ' + (idx + 1);
    lbImg.onerror = () => { lbImg.style.opacity = .15; };
    lbCount.textContent = `${idx + 1} / ${CONFIG.fotos.length}`;
  }
  function open(i){ show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function close(){ lb.classList.remove('open'); document.body.style.overflow = ''; }
  $('#lb-close').addEventListener('click', close);
  $('#lb-prev').addEventListener('click', () => show(idx - 1));
  $('#lb-next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  // deslizar com o dedo
  let sx = 0;
  lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
})();

/* ---- Carta ---- */
(function letter(){
  const env = $('#envelope'), wrap = $('#paper-wrap'), paper = $('#paper');
  if (!env) return;
  let opened = false;
  env.addEventListener('click', () => {
    if (opened) return; opened = true;
    env.classList.add('open');
    setTimeout(() => wrap.classList.add('open'), 700);
    setTimeout(() => {
      paper.classList.add('read');
      $$('p', paper).forEach((p, i) => p.style.transitionDelay = (i * .9) + 's');
      const r = env.getBoundingClientRect();
      Confetti.burst(r.left + r.width/2, r.top + 20, 60, .7);
    }, 1500);
  });
  env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); env.click(); } });
})();

/* ---- Coração ao tocar na tela ---- */
addEventListener('pointerdown', e => {
  if (e.target.closest('button, a, .lightbox, .envelope')) return;
  const h = document.createElement('div');
  h.className = 'tap-heart';
  h.textContent = ['💕','💖','💗','✨','💍'][(Math.random()*5)|0];
  h.style.left = e.clientX + 'px'; h.style.top = e.clientY + 'px';
  h.style.setProperty('--dx', (Math.random()*80 - 40) + 'px');
  h.style.setProperty('--r', (Math.random()*40 - 20) + 'deg');
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1200);
});

/* ---- Dock: destaca a seção atual ---- */
(function dock(){
  const links = $$('.dock a[href^="#"]');
  const secs = links.map(a => $(a.getAttribute('href')));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => s && io.observe(s));
})();
