/* Motor de confete em canvas: explosão, canhões, chuva, corações e emojis */
const Confetti = (() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:9999 });
  const ctx = canvas.getContext('2d');
  let W, H, dpr, parts = [], running = false, rainTimer = null;

  const COLORS = ['#e6c98f','#f4c2bb','#e0647e','#ffffff','#b48bff','#ff7eb6','#6fd3ff','#ffe066'];
  const EMOJIS = ['💍','🏢','💕','🔑','✨','🥂','💖'];
  const rand = (a,b) => a + Math.random()*(b-a);

  function resize(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W*dpr; canvas.height = H*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize);
  document.addEventListener('DOMContentLoaded', () => { document.body.appendChild(canvas); resize(); });

  function heart(x,y,s){
    ctx.beginPath();
    ctx.moveTo(x, y + s*.3);
    ctx.bezierCurveTo(x, y, x - s*.5, y, x - s*.5, y + s*.3);
    ctx.bezierCurveTo(x - s*.5, y + s*.6, x, y + s*.8, x, y + s*1.05);
    ctx.bezierCurveTo(x, y + s*.8, x + s*.5, y + s*.6, x + s*.5, y + s*.3);
    ctx.bezierCurveTo(x + s*.5, y, x, y, x, y + s*.3);
    ctx.fill();
  }

  function make(x, y, vx, vy){
    const r = Math.random();
    const type = r < .08 ? 'emoji' : r < .22 ? 'heart' : r < .4 ? 'circle' : 'rect';
    return {
      x, y, vx, vy, type,
      size: type === 'emoji' ? rand(16,26) : rand(7,14),
      color: COLORS[(Math.random()*COLORS.length)|0],
      emoji: EMOJIS[(Math.random()*EMOJIS.length)|0],
      rot: rand(0,6.28), vr: rand(-.22,.22),
      wob: rand(0,6.28), wobSpeed: rand(.05,.14),
      drag: rand(.965,.985), life: 0
    };
  }

  function burst(x, y, n = 140, power = 1){
    if (reduce) n = Math.min(n, 30);
    for (let i = 0; i < n; i++){
      const a = rand(0, Math.PI*2), s = rand(4, 17) * power;
      parts.push(make(x, y, Math.cos(a)*s, Math.sin(a)*s - 3));
    }
    start();
  }

  // canhão: dispara em leque a partir de um ponto, num ângulo
  function cannon(x, y, angleDeg, n = 70){
    if (reduce) n = 15;
    for (let i = 0; i < n; i++){
      const a = (angleDeg + rand(-22,22)) * Math.PI/180, s = rand(10, 24);
      parts.push(make(x, y, Math.cos(a)*s, -Math.sin(a)*s));
    }
    start();
  }

  function rain(ms = 6000, rate = 55){
    if (reduce) return;
    clearInterval(rainTimer);
    const end = performance.now() + ms;
    rainTimer = setInterval(() => {
      if (performance.now() > end) return clearInterval(rainTimer);
      const p = make(rand(0, W), -20, rand(-1,1), rand(1.5,3.5));
      p.drag = 1; p.rain = true;
      parts.push(p);
    }, rate);
    start();
  }

  function start(){ if (!running){ running = true; requestAnimationFrame(loop); } }

  function loop(){
    ctx.clearRect(0,0,W,H);
    for (let i = parts.length - 1; i >= 0; i--){
      const p = parts[i];
      p.life++;
      p.vx *= p.rain ? 1 : p.drag;
      p.vy = p.rain ? Math.min(p.vy + .02, 3.2) : (p.vy * p.drag + .28);
      if (!p.rain && p.vy > 4) p.vy = 4 + (p.vy-4)*.6;
      p.wob += p.wobSpeed;
      p.x += p.vx + Math.sin(p.wob) * (p.rain ? 1.1 : .5);
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > H + 40 || p.x < -60 || p.x > W + 60){ parts.splice(i,1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.type === 'rect'){
        ctx.scale(1, Math.cos(p.wob));
        ctx.fillRect(-p.size/2, -p.size/3, p.size, p.size*.6);
      } else if (p.type === 'circle'){
        ctx.beginPath(); ctx.arc(0,0,p.size/2.4,0,6.28); ctx.fill();
      } else if (p.type === 'heart'){
        heart(0, -p.size/2, p.size);
      } else {
        ctx.font = p.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
      }
      ctx.restore();
    }
    if (parts.length || rainTimer){ requestAnimationFrame(loop); } else { running = false; ctx.clearRect(0,0,W,H); }
  }

  // sequência de abertura: a grande explosão
  function celebrate(){
    const cx = innerWidth/2, cy = innerHeight*.45;
    setTimeout(() => burst(cx, cy, 170, 1.15), 300);
    setTimeout(() => { cannon(0, innerHeight, 62, 80); cannon(innerWidth, innerHeight, 118, 80); }, 850);
    setTimeout(() => burst(cx, cy*.8, 110, .9), 1500);
    setTimeout(() => rain(7000), 1900);
  }

  return { burst, cannon, rain, celebrate };
})();
