/* 슬라이드 부품: content/slides.js에서 쓰는 함수들. 전부 HTML 문자열을 돌려준다.
   모양은 css/components.css에서 고친다. */
window.UI = (() => {
  const join = (items) => [items].flat().filter(Boolean).join('');

  const p = (text) => `<p>${text}</p>`;
  const small = (text) => `<p class="small">${text}</p>`;
  const statement = (text) => `<p class="statement">${text}</p>`; // 슬라이드 아래쪽 결론 한 문장
  const list = (items) => `<ul class="plain">${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;

  /* col({ label, title, text }) — 항목은 모두 선택, text는 글 또는 글 목록 */
  const col = ({ label, title, text }) => `<div class="col">
    ${label ? `<span class="label">${label}</span>` : ''}${title ? `<h3>${title}</h3>` : ''}
    ${[text].flat().filter(Boolean).map((t) => (t.startsWith('<') ? t : p(t))).join('')}</div>`;
  const cols = (n, items) => `<div class="cols n${n}">${join(items)}</div>`;
  const center = (items) => `<div class="center">${join(items)}</div>`; // 세로 가운데 정렬

  /* table({ head: [['제목', '너비']...], rows: [[칸...]...], compact }) */
  const table = ({ head, rows, compact }) => `<table class="t${compact ? ' compact' : ''}"><thead><tr>${head.map(([label, w]) => `<th${w ? ` style="width:${w}"` : ''}>${label}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  /* ladder: 가운데 로그 축에서 선을 뽑아 끝에 설명을 단다. 값만 적으면 위치는 자동.
     up: 축 위쪽 묶음, dn: 축 아래쪽 묶음. { label, markers }
     표식 { at, range: [낮은값, 높은값], v: 큰 글자, w: 설명, level: 선 길이(1, 2, 3...) }
     선이 글자를 가로지르지 않게: 위쪽은 왼쪽 점일수록, 아래쪽은 오른쪽 점일수록 level을 크게 준다. */
  const ladder = ({ min, max, ticks, up, dn }) => {
    const pos = (x) => ((Math.log10(x) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))) * 100;
    const pct = (x) => pos(x).toFixed(2) + '%';
    const stem = (m) => `<div class="stem" style="left:${pct(m.at)};--lv:${m.level}"><div class="tx"><b>${m.v}</b><span>${m.w}</span></div></div>`;
    const dot = (m) => `${m.range ? `<i class="range-bar" style="left:${pct(m.range[0])};width:${(pos(m.range[1]) - pos(m.range[0])).toFixed(2)}%"></i>` : ''}<i class="dot" style="left:${pct(m.at)}"></i>`;
    const all = [...up.markers, ...dn.markers];
    const levels = (g) => Math.max(...g.markers.map((m) => m.level));
    return `<div class="ladder">
      <div class="lab">${up.label}</div><div class="zone up" style="--max:${levels(up)}">${up.markers.map(stem).join('')}</div>
      <div></div><div class="axis">${all.map(dot).join('')}</div>
      <div class="lab">${dn.label}</div><div class="zone dn" style="--max:${levels(dn)}">
        <div class="ticks">${ticks.map(([x, name]) => `<span style="left:${pct(x)}">${name}</span>`).join('')}</div>
        ${dn.markers.map(stem).join('')}</div>
    </div>`;
  };

  /* 왼쪽 글 + 오른쪽 시뮬레이션. simId는 content/sims.js의 이름 */
  const simSlide = (simId, text) => `<div class="sim-wrap"><div class="sim-text">${join(text)}</div>${Sims.markup(simId)}</div>`;
  const question = (text) => `<p class="q">${text}</p>`;
  const questionLabel = (text) => `<p class="q-label">${text}</p>`;
  /* 매개변수 설명: params([['α', '설명'], ...]) */
  const params = (items) => `<dl class="params">${items.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;

  return { p, small, statement, params, list, col, cols, center, table, ladder, simSlide, question, questionLabel };
})();
