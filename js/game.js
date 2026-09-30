/* ========== JOGOS ========== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---- utilidades ---- */
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1600);
}
function win(emoji, title, text){
  $('#modal-emoji').textContent = emoji;
  $('#modal-title').textContent = title;
  $('#modal-text').textContent = text;
  setTimeout(() => $('#modal').classList.add('open'), 700);
  Confetti.burst(innerWidth/2, innerHeight*.4, 160, 1.1);
  Confetti.cannon(0, innerHeight, 62, 60);
  Confetti.cannon(innerWidth, innerHeight, 118, 60);
  Confetti.rain(3500);
}
$('#modal-close').addEventListener('click', () => $('#modal').classList.remove('open'));

/* ---- abas ---- */
$$('.tab').forEach(b => b.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === b));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === b.dataset.tab));
}));

/* =====================================================
   1) PUZZLE DESLIZANTE
   ===================================================== */
const Puzzle = (() => {
  const board = $('#p-board');
  let n = 3, slots = [], tiles = [], moves = 0, sec = 0, timer = null, started = false, done = false;
  let photo = CONFIG.fotos[0].src, hasImg = false;

  // seletor de foto
  const pick = $('#p-pick'); pick.classList.add('pick');
  CONFIG.fotos.forEach((f, i) => {
    const b = document.createElement('button');
    b.style.backgroundImage = `url(${f.src})`;
    b.textContent = b.style.backgroundImage ? '' : (i + 1);
    b.setAttribute('aria-label', 'Foto ' + (i + 1));
    if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => { photo = f.src; $$('button', pick).forEach(x => x.classList.toggle('on', x === b)); init(); });
    pick.appendChild(b);
  });

  function fmt(s){ return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
  function pos(slot){ return { left: (slot % n) * 100 / n + '%', top: Math.floor(slot / n) * 100 / n + '%' }; }

  function place(id){
    const slot = slots.indexOf(id), p = pos(slot), t = tiles[id];
    t.style.left = p.left; t.style.top = p.top;
  }

  function neighbors(a, b){
    const ra = Math.floor(a/n), ca = a % n, rb = Math.floor(b/n), cb = b % n;
    return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
  }

  function move(id, silent){
    const hole = n*n - 1;
    const from = slots.indexOf(id), to = slots.indexOf(hole);
    if (!neighbors(from, to)) return false;
    slots[from] = hole; slots[to] = id;
    place(id); place(hole);
    if (!silent){
      if (!started){ started = true; timer = setInterval(() => $('#p-time').textContent = fmt(++sec), 1000); }
      $('#p-moves').textContent = ++moves;
      if (navigator.vibrate) navigator.vibrate(12);
      check();
    }
    return true;
  }

  function check(){
    if (slots.every((v, i) => v === i)){
      done = true; clearInterval(timer);
      board.classList.add('won');
      win('🧩', 'Montou, Clarinha!', `Em ${moves} movimentos e ${fmt(sec)}. Você é demais!`);
    }
  }

  function shuffle(){
    const hole = n*n - 1; let last = -1;
    for (let i = 0; i < n*n*40; i++){
      const hs = slots.indexOf(hole);
      const opts = slots.map((v, s) => s).filter(s => neighbors(s, hs) && s !== last);
      const s = opts[(Math.random() * opts.length) | 0];
      last = hs;
      move(slots[s], true);
    }
    if (slots.every((v, i) => v === i)) shuffle();
  }

  function build(){
    board.innerHTML = ''; board.className = 'board';
    board.style.setProperty('--peek', hasImg ? `url(${photo})` : 'none');
    slots = Array.from({ length: n*n }, (_, i) => i);
    tiles = [];
    for (let id = 0; id < n*n; id++){
      const t = document.createElement('div');
      t.className = 'tile';
      t.style.width = t.style.height = 100 / n + '%';
      const r = Math.floor(id / n), c = id % n;
      if (hasImg){
        t.style.backgroundImage = `url(${photo})`;
        t.style.backgroundSize = `${n*100}% ${n*100}%`;
        t.style.backgroundPosition = `${c * 100/(n-1)}% ${r * 100/(n-1)}%`;
        t.innerHTML = `<span>${id + 1}</span>`;
      } else {
        t.classList.add('noimg'); t.innerHTML = `<span>${id + 1}</span>`;
      }
      if (id === n*n - 1) t.classList.add('hole');
      t.addEventListener('pointerdown', e => { e.preventDefault(); if (!done) move(id); });
      board.appendChild(t); tiles.push(t);
    }
    slots.forEach(id => place(id));
  }

  function init(){
    clearInterval(timer); moves = sec = 0; started = done = false;
    $('#p-moves').textContent = 0; $('#p-time').textContent = '0:00';
    // testa se a imagem existe
    const img = new Image();
    const go = ok => { hasImg = ok; build(); shuffle(); };
    img.onload = () => go(true); img.onerror = () => go(false);
    img.src = photo;
  }

  $$('[data-size]').forEach(b => {
    if (+b.dataset.size === n) b.classList.add('on');
    b.addEventListener('click', () => { n = +b.dataset.size; $$('[data-size]').forEach(x => x.classList.toggle('on', x === b)); init(); });
  });
  $('#p-shuffle').addEventListener('click', init);
  const peek = $('#p-peek');
  const on = () => hasImg && board.classList.add('peek'), off = () => board.classList.remove('peek');
  peek.addEventListener('pointerdown', on);
  ['pointerup','pointerleave','pointercancel'].forEach(ev => peek.addEventListener(ev, off));
  peek.textContent = '👀 Segure p/ ver';

  init();
})();

/* =====================================================
   2) MEMÓRIA
   ===================================================== */
const Memoria = (() => {
  const EMO = ['💍','🏢','🔑','💕','🥂','📸'];
  const grid = $('#m-grid');
  let first = null, lock = false, moves = 0, pairs = 0;

  function reset(){
    grid.innerHTML = ''; first = null; lock = false; moves = pairs = 0;
    $('#m-moves').textContent = 0; $('#m-pairs').textContent = '0/6';
    const deck = [...EMO, ...EMO].sort(() => Math.random() - .5);
    deck.forEach(e => {
      const c = document.createElement('div'); c.className = 'card'; c.dataset.e = e;
      c.innerHTML = `<div class="in"><div class="b">💗</div><div class="f">${e}</div></div>`;
      c.addEventListener('pointerdown', () => flip(c));
      grid.appendChild(c);
    });
  }

  function flip(c){
    if (lock || c.classList.contains('flipped')) return;
    c.classList.add('flipped');
    if (navigator.vibrate) navigator.vibrate(8);
    if (!first){ first = c; return; }
    $('#m-moves').textContent = ++moves;
    if (first.dataset.e === c.dataset.e){
      first.classList.add('matched'); c.classList.add('matched');
      const r = c.getBoundingClientRect();
      Confetti.burst(r.left + r.width/2, r.top + r.height/2, 28, .5);
      first = null; $('#m-pairs').textContent = ++pairs + '/6';
      if (pairs === 6) win('🃏', 'Todos os pares!', `Você terminou em ${moves} jogadas. Memória de elefante!`);
    } else {
      lock = true; const a = first; first = null;
      setTimeout(() => { a.classList.remove('flipped'); c.classList.remove('flipped'); lock = false; }, 850);
    }
  }
  $('#m-new').addEventListener('click', reset);
  reset();
})();
