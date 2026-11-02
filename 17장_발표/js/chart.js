/* 캔버스 선 그래프. 옅은 시행은 회색, 대표선은 강조색. */
window.Chart = (() => {
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const DPR = 2;
  const PAD = { left: 76, right: 12, top: 12, bottom: 56 };

  /* 축 최댓값을 보기 좋은 수로 올린다 */
  function niceMax(v) {
    if (v <= 0) return 10;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
    return 10 * p;
  }

  /* o: { xMin, xMax, yMin, yMax, log, xTicks, yTicks, yFmt, xLabel, yLabel,
          bands: [{from,to,label}], hlines: [{y,label,align}],
          faint: [[y...]...] 세대별 시행들, main: [[x,y]...] 대표선, dot: {x,y} } */
  function draw(canvas, o) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * DPR; canvas.height = h * DPR;
    const g = canvas.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, w, h);

    const ink = css('--ink'), gray = css('--gray'), line = css('--line'), accent = css('--accent');
    const font = '17px ' + css('--font');
    const { left: L, right: R, top: T, bottom: B } = PAD;
    const pw = w - L - R, ph = h - T - B;

    const xMin = o.xMin ?? 0, yMin = o.yMin ?? 0;
    const X = (x) => L + ((x - xMin) / (o.xMax - xMin)) * pw;
    const Y = o.log
      ? (y) => T + ph - ((Math.log10(Math.max(y, yMin)) - Math.log10(yMin)) / (Math.log10(o.yMax) - Math.log10(yMin))) * ph
      : (y) => T + ph - ((y - yMin) / (o.yMax - yMin)) * ph;
    const path = (pts, color, width, alpha = 1) => {
      g.strokeStyle = color; g.globalAlpha = alpha; g.lineWidth = width; g.lineJoin = 'round';
      g.beginPath();
      pts.forEach(([x, y], i) => { const yy = Y(Math.min(y, o.yMax)); i ? g.lineTo(X(x), yy) : g.moveTo(X(x), yy); });
      g.stroke(); g.globalAlpha = 1;
    };

    g.font = font;
    // 음영 구간
    (o.bands || []).forEach((bd) => {
      g.fillStyle = css('--tint');
      g.fillRect(X(bd.from), T, X(bd.to) - X(bd.from), ph);
      if (bd.label) { g.fillStyle = gray; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(bd.label, X(bd.from) + 8, T + 8); }
    });

    // 눈금
    g.lineWidth = 1;
    o.yTicks.forEach((v) => {
      const y = Y(v);
      g.strokeStyle = line; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke();
      g.fillStyle = gray; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText(o.yFmt ? o.yFmt(v) : v, L - 10, y);
    });
    g.textBaseline = 'top'; g.textAlign = 'center';
    o.xTicks.forEach((v) => { g.fillText(v, X(v), T + ph + 8); });
    g.textAlign = 'right'; g.fillText(o.xLabel, L + pw, T + ph + 32);
    g.textAlign = 'left'; g.fillText(o.yLabel, L, T + ph + 32);

    // 기준선
    (o.hlines || []).forEach((hl) => {
      const y = Y(hl.y);
      g.setLineDash([4, 5]); g.strokeStyle = gray; g.beginPath(); g.moveTo(L, y); g.lineTo(L + pw, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = ink; g.textAlign = hl.align || 'right'; g.textBaseline = 'bottom';
      g.fillText(hl.label, hl.align === 'left' ? L + 8 : L + pw - 4, y - 4);
    });

    (o.faint || []).forEach((r) => path(r.map((y, t) => [t, y]), gray, 1.2, 0.3));
    if (o.main) path(o.main, accent, 3);

    if (o.dot) {
      g.fillStyle = accent;
      g.beginPath(); g.arc(X(o.dot.x), Y(o.dot.y), 8, 0, Math.PI * 2); g.fill();
    }
  }

  return { draw, niceMax };
})();
