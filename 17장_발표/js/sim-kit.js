/* 시뮬레이션 틀. content/sims.js에 적은 설정으로 계기판과 슬라이더를 만들고 연결한다.
   Sims.define('이름', {
     controls: [{ key, label, min, max, step, value, read: 슬라이더값→실제값, show: 실제값→표시 글자 }],
     readouts: [{ key, label }],
     status: true,        // 상태 글자 표시 여부
     note: '아래 설명',
     steps: [{ key: 슬라이더값 }, ...],  // 발표 단계. '다음'을 누르면 차례로 이 값으로 움직인다
     render(values, ui),  // ui.set(key, 글자), ui.status(글자, 나쁜상태여부), ui.chart(옵션)
   }); */
window.Sims = (() => {
  const defs = {};
  const ANIM_MS = 600;

  const define = (id, def) => { defs[id] = def; };

  function markup(id) {
    const d = defs[id];
    if (!d) throw new Error('content/sims.js에 없는 시뮬레이션: ' + id);
    const readouts = d.readouts.map((r) => `<div class="ro"><span class="k">${r.label}</span><span class="v" data-o="${r.key}">–</span></div>`).join('');
    const controls = d.controls.map((c) => {
      const inputId = `${id}-${c.key}`;
      return `<div><label for="${inputId}">${c.label} <output data-c="${c.key}"></output></label>
        <input id="${inputId}" data-k="${c.key}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value}"></div>`;
    }).join('');
    const dots = d.steps ? `<span class="dots">${d.steps.map(() => '<i></i>').join('')}</span>` : '';
    return `<div class="sim" data-sim="${id}">
      <div class="readout">${readouts}${d.status ? '<span class="status" data-status></span>' : ''}</div>
      <canvas></canvas>
      <div class="ctl${d.controls.length === 1 ? ' one' : ''}">${controls}</div>
      <div class="sim-foot">${d.note ? `<p class="small">${d.note}</p>` : '<span></span>'}${dots}</div>
    </div>`;
  }

  function render(root) {
    const d = defs[root.dataset.sim];
    const values = {};
    d.controls.forEach((c) => {
      const raw = +root.querySelector(`[data-k="${c.key}"]`).value;
      values[c.key] = c.read ? c.read(raw) : raw;
      root.querySelector(`[data-c="${c.key}"]`).textContent = c.show(values[c.key]);
    });
    d.render(values, {
      set: (key, text) => { root.querySelector(`[data-o="${key}"]`).textContent = text; },
      status: (text, bad) => { const s = root.querySelector('[data-status]'); s.className = 'status' + (bad ? ' down' : ''); s.textContent = text; },
      chart: (opts) => Chart.draw(root.querySelector('canvas'), opts),
    });
  }

  /* ---------- 발표 단계 ---------- */
  const input = (root, key) => root.querySelector(`[data-k="${key}"]`);
  const stepRoot = (slide) => [...slide.querySelectorAll('[data-sim]')].find((r) => defs[r.dataset.sim].steps);

  function markStep(root, i) {
    root.dataset.step = i;
    root.querySelectorAll('.dots i').forEach((dot, j) => dot.classList.toggle('on', j === i));
  }

  function stopAnim(root) {
    cancelAnimationFrame(root._anim);
    clearTimeout(root._finish);
  }

  function setValues(root, target) {
    stopAnim(root);
    Object.entries(target).forEach(([k, v]) => { input(root, k).value = v; });
    render(root);
  }

  /* 지금 값에서 목표 값으로 슬라이더를 부드럽게 움직인다 */
  function animateTo(root, target) {
    stopAnim(root);
    const from = Object.fromEntries(Object.keys(target).map((k) => [k, +input(root, k).value]));
    let t0 = null; // 첫 프레임의 시각을 기준으로 삼는다
    const frame = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.max(0, Math.min(1, (now - t0) / ANIM_MS));
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // 천천히 출발해 천천히 멈춘다
      Object.entries(target).forEach(([k, v]) => { input(root, k).value = from[k] + (v - from[k]) * e; });
      render(root);
      if (t < 1) root._anim = requestAnimationFrame(frame);
      else setValues(root, target);
    };
    root._anim = requestAnimationFrame(frame);
    // 화면 갱신이 멈춰도(창이 가려진 경우 등) 목표 값에는 반드시 도착하게 한다
    root._finish = setTimeout(() => setValues(root, target), ANIM_MS + 150);
  }

  /* 슬라이드에 들어올 때: 앞에서 왔으면 첫 단계, 뒤에서 왔으면 마지막 단계 */
  function enter(slide, fromBehind) {
    const root = stepRoot(slide);
    if (!root) return;
    const steps = defs[root.dataset.sim].steps;
    const i = fromBehind ? steps.length - 1 : 0;
    markStep(root, i);
    setValues(root, steps[i]);
  }

  /* 단계를 하나 넘긴다. 넘길 단계가 없으면 false (그때는 슬라이드를 넘긴다) */
  function step(slide, dir) {
    const root = stepRoot(slide);
    if (!root) return false;
    const steps = defs[root.dataset.sim].steps;
    const i = +root.dataset.step + dir;
    if (i < 0 || i >= steps.length) return false;
    markStep(root, i);
    animateTo(root, steps[i]);
    return true;
  }

  /* 슬라이더 연결 (슬라이드가 화면에 만들어진 뒤 한 번) */
  const wire = (stage) => stage.querySelectorAll('[data-sim]').forEach((root) => {
    root.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => { stopAnim(root); render(root); }));
  });
  /* 보이는 슬라이드 안의 시뮬레이션만 그린다 (숨겨진 캔버스는 크기가 0) */
  const renderIn = (slide) => slide.querySelectorAll('[data-sim]').forEach(render);

  return { define, markup, wire, renderIn, enter, step };
})();
