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

  /* 한 번의 시행. pop(t): t세대에 배우는 사람 수.
     숙련도가 0이 되면 그 기술을 아는 사람이 없으므로 그 뒤로는 0에 머문다(가정). */
  function run({ gens, pop, alpha, beta = 1, start = 10, seed = 1 }) {
    const r = rng(seed);
    const out = [start];
    let b = start;
    for (let t = 0; t < gens; t++) {
      if (b > 0) b = Math.max(0, b - alpha + beta * Math.log(pop(t)) + gumbel(r, beta));
      out.push(b);
    }
    return out;
  }

  /* 시드를 하나씩 바꿔 여러 번 돌린다 */
  const runMany = (count, firstSeed, opts) => Array.from({ length: count }, (_, k) => run({ ...opts, seed: firstSeed + k }));

  /* ---------- 숫자 표기 ---------- */
  const group = (n) => n.toLocaleString('ko-KR');

  return { nStar, deltaZ, run, runMany, group };
})();
