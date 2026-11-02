/* 시뮬레이션 틀. content/sims.js에 적은 설정으로 계기판과 슬라이더를 만들고 연결한다.
   Sims.define('이름', {
     controls: [{ key, label, min, max, step, value, read: 슬라이더값→실제값, show: 실제값→표시 글자 }],
     readouts: [{ key, label }],
     status: true,        // 상태 글자 표시 여부
     note: '아래 설명',
     render(values, ui),  // ui.set(key, 글자), ui.status(글자, 나쁜상태여부), ui.chart(옵션)
   }); */
window.Sims = (() => {
  const defs = {};

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
    return `<div class="sim" data-sim="${id}">
      <div class="readout">${readouts}${d.status ? '<span class="status" data-status></span>' : ''}</div>
      <canvas></canvas>
      <div class="ctl${d.controls.length === 1 ? ' one' : ''}">${controls}</div>
      ${d.note ? `<p class="small">${d.note}</p>` : ''}
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

  /* 슬라이더 연결 (슬라이드가 화면에 만들어진 뒤 한 번) */
  const wire = (stage) => stage.querySelectorAll('[data-sim]').forEach((root) => {
    root.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', () => render(root)));
  });
  /* 보이는 슬라이드 안의 시뮬레이션만 그린다 (숨겨진 캔버스는 크기가 0) */
  const renderIn = (slide) => slide.querySelectorAll('[data-sim]').forEach(render);

  return { define, markup, wire, renderIn };
})();
