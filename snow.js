// 배경 눈 내리는 효과 (카드 뒤 배경에서만, 터치 방해 없음)
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'snowCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  const COUNT = 40;
  let w = 0, h = 0, dpr = 1;
  let flakes = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFlake(randomY) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -10,
      r: 1 + Math.random() * 2.4,            // 크기
      speed: 0.35 + Math.random() * 0.7,     // 낙하 속도 (천천히)
      sway: 0.4 + Math.random() * 0.9,       // 좌우 흔들림 폭
      phase: Math.random() * Math.PI * 2,
      alpha: 0.45 + Math.random() * 0.5,
    };
  }

  resize();
  for (let i = 0; i < COUNT; i++) flakes.push(makeFlake(true));
  window.addEventListener('resize', resize);

  let last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.phase += 0.012 * dt;
      f.y += f.speed * dt;
      f.x += Math.sin(f.phase) * f.sway * 0.35 * dt;
      if (f.y > h + 10) Object.assign(f, makeFlake(false));
      if (f.x > w + 10) f.x = -10;
      if (f.x < -10) f.x = w + 10;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,' + f.alpha + ')';
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
