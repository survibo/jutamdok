/* 헨릭(2004) 전수 모델과 숫자 표기.
   가장 숙련된 사람의 수준 b를 추적한다.
   N명의 학습자가 각각 (스승 − α + Gumbel(0, β))를 얻으면,
   그중 최댓값은 정확히 스승 − α + β·ln N + Gumbel(0, β)를 따른다.
   따라서 기대 변화는 Δz = −α + β(γ + ln N)로 논문 식 (2)와 같다. */
window.Model = (() => {
  const GAMMA = 0.5772156649;

  /* mulberry32: 같은 설정이면 같은 그림이 나오도록 시드를 고정한다 */
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gumbel = (r, beta) => -beta * Math.log(-Math.log(Math.max(r(), 1e-12)));

  const nStar = (alpha, beta = 1) => Math.exp(alpha / beta - GAMMA);
  const deltaZ = (alpha, n, beta = 1) => -alpha + beta * (GAMMA + Math.log(n));

  /* 한 번의 시행. pop(t): t세대 인구, link(t): 지구와 연결 여부, earth: 지구 수준, ai: AI가 맡는 몫 */
  function run({ gens, pop, alpha, beta = 1, ai = 0, start = 10, link = () => false, earth = 30, seed = 1 }) {
    const r = rng(seed);
    const a = alpha * (1 - ai);
    const out = [start];
    let b = start, extinct = false;
    for (let t = 0; t < gens; t++) {
      const linked = link(t);
      if (extinct && !linked) { out.push(0); continue; } // 가르칠 사람이 없으면 되살아나지 않는다
      const teacher = linked ? Math.max(b, earth) : b;
      b = teacher - a + beta * Math.log(pop(t)) + gumbel(r, beta);
      if (b <= 0) { b = 0; extinct = true; } else extinct = false;
      out.push(b);
    }
    return out;
  }

  /* 시드를 하나씩 바꿔 여러 번 돌린다 */
  const runMany = (count, firstSeed, opts) => Array.from({ length: count }, (_, k) => run({ ...opts, seed: firstSeed + k }));

  /* 세대별 평균: [[세대, 평균]...] */
  const mean = (runs) => runs[0].map((_, t) => [t, runs.reduce((s, r) => s + r[t], 0) / runs.length]);

  /* ---------- 숫자 표기 ---------- */
  const group = (n) => n.toLocaleString('ko-KR');
  function people(n) {
    if (!isFinite(n)) return '∞';
    if (n < 1) return '1명 미만';
    if (n < 1e4) return group(Math.round(n)) + '명';
    const [v, unit] = n < 1e8 ? [n / 1e4, '만 명'] : [n / 1e8, '억 명'];
    return (v < 100 ? v.toFixed(1).replace(/\.0$/, '') : group(Math.round(v))) + unit;
  }
  const percent = (x) => Math.round(x * 100) + '%';

  return { nStar, deltaZ, run, runMany, mean, group, people, percent };
})();
