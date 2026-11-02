/* 슬라이드 만들기, 이동, 화면 맞춤. 내용은 content/slides.js에 있다. */
(() => {
  const STAGE_W = 1600, STAGE_H = 900, MARGIN = 0.97;
  const stage = document.getElementById('stage');

  /* 고치다가 슬라이드 파일에 문법 오류가 나면 빈 화면 대신 알려 준다 */
  if (!window.SLIDES) {
    stage.classList.add('ready');
    stage.innerHTML = '<div class="load-error">슬라이드를 불러오지 못했습니다. content/slides.js 또는 content/sims.js의 문법 오류일 수 있습니다. (F12 → Console에서 줄 번호 확인)</div>';
    return;
  }

  /* ---------- 슬라이드 만들기 ---------- */
  const total = SLIDES.length;

  function slideHtml(s, i) {
    const left = [s.sec, s.ref].filter(Boolean).join('&emsp;');
    return `<section class="slide ${s.cls || ''}">
      ${s.title ? `<h2>${s.title}</h2>` : ''}
      ${[s.body].flat().join('')}
      ${s.noFoot ? '' : `<div class="foot"><span>${left}</span><span>${i + 1}</span></div>`}
    </section>`;
  }

  stage.innerHTML = SLIDES.map(slideHtml).join('');
  const slides = [...stage.querySelectorAll('.slide')];
  Sims.wire(stage);

  /* ---------- 이동 ---------- */
  let cur = 0;

  function show(i) {
    if (document.activeElement && document.activeElement.type === 'range') document.activeElement.blur();
    cur = Math.max(0, Math.min(total - 1, i));
    slides.forEach((s, j) => s.classList.toggle('on', j === cur));
    document.getElementById('cnt').textContent = (cur + 1) + ' / ' + total;
    if (location.hash !== '#s' + (cur + 1)) history.replaceState(null, '', '#s' + (cur + 1));
    redraw();
  }
  const redraw = () => Sims.renderIn(slides[cur]);

  function fromHash() {
    const m = /^#s(\d+)$/.exec(location.hash);
    return m ? parseInt(m[1], 10) - 1 : 0;
  }

  function fit() {
    const k = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H) * MARGIN;
    stage.style.transform = `translate(-50%, -50%) scale(${k})`;
  }

  function toggleFullscreen() {
    const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    if (p && p.catch) p.catch(() => {});
  }

  document.getElementById('prev').addEventListener('click', () => show(cur - 1));
  document.getElementById('next').addEventListener('click', () => show(cur + 1));
  document.getElementById('fs').addEventListener('click', toggleFullscreen);

  document.addEventListener('keydown', (e) => {
    const onSlider = e.target && e.target.type === 'range';
    const onButton = e.target && e.target.tagName === 'BUTTON';
    // 슬라이더에서 ←→는 값 조절, 버튼에서 스페이스는 버튼 누르기. 발표 리모컨의 PageUp/Down은 항상 넘긴다.
    if (onSlider && e.key.startsWith('Arrow')) return;
    if (onButton && e.key === ' ') return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); show(cur + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); show(cur - 1); }
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(total - 1);
  });

  /* 터치패드 두 손가락 쓸기(휠 이벤트). 손을 뗀 뒤에도 관성으로 이벤트가 이어지므로,
     한 번 넘긴 뒤에는 이벤트가 잠시 멈출 때까지 더 넘기지 않는다. */
  const WHEEL_THRESHOLD = 40, WHEEL_QUIET_MS = 200;
  let wheelSum = 0, wheelLocked = false, wheelTimer;
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // 핀치 확대는 건드리지 않는다
    e.preventDefault(); // 브라우저의 뒤로 가기 제스처를 막는다
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelLocked = false; wheelSum = 0; }, WHEEL_QUIET_MS);
    if (wheelLocked) return;
    wheelSum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(wheelSum) >= WHEEL_THRESHOLD) {
      show(cur + (wheelSum > 0 ? 1 : -1));
      wheelLocked = true;
    }
  }, { passive: false });

  /* 화면 터치나 마우스로 끌어서 넘기기. 슬라이더와 버튼 위에서는 동작하지 않는다. */
  const SWIPE_MIN_PX = 60;
  let swipe = null;
  window.addEventListener('pointerdown', (e) => {
    swipe = e.target.closest('input, button') ? null : { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', (e) => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('pointercancel', () => { swipe = null; });

  window.addEventListener('hashchange', () => show(fromHash()));
  window.addEventListener('resize', fit);

  /* 글꼴이 바뀌면서 글자가 움직이지 않도록, 전체 슬라이드에 쓰는 글자를 받은 뒤에 화면을 보여 준다.
     인터넷이 없거나 느리면 FONT_WAIT_MS 뒤에 시스템 글꼴로라도 보여 준다. */
  const FONT_WAIT_MS = 2000;
  const fontFamily = getComputedStyle(document.body).fontFamily;
  const fontsLoaded = Promise.all(
    ['400', '600'].map((weight) => document.fonts.load(`${weight} 30px ${fontFamily}`, stage.textContent))
  ).catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS));
  Promise.race([fontsLoaded, timeout]).then(() => {
    stage.classList.add('ready');
    redraw(); // 차트 글자도 받은 글꼴로 다시 그린다
  });
  fontsLoaded.then(redraw); // 시간 초과 뒤에 글꼴이 도착한 경우

  fit();
  show(fromHash());
})();
