/* 시뮬레이션 두 개의 설정. 숫자(기본 인구, α 등)는 각 블록 맨 위에서 고친다.
   왼쪽 글은 content/slides.js에 있다. */
(() => {
  const { nStar, deltaZ, runMany, mean, group, people, percent } = Model;
  const fixed1 = (x) => x.toFixed(1);
  const fromLog10 = (v) => Math.round(Math.pow(10, v)); // 인구 슬라이더는 로그 눈금
  const peopleExact = (n) => group(n) + "명";

  /* Δz 값에 따른 상태 표시 */
  const trend = (ui, dz) => {
    if (dz > 0.05) ui.status("발전");
    else if (dz < -0.05) ui.status("퇴보 → 소실", true);
    else ui.status("겨우 유지");
  };

  /* 원리와 참사 시뮬레이션이 함께 쓰는 '세대별 숙련도' 그래프 */
  const levelChart = ({ gens, xTicks, runs, main, floor, ...rest }) => {
    const yMax = Chart.niceMax(Math.max(floor, ...runs.flat()));
    return {
      xMax: gens,
      yMax,
      xTicks,
      yTicks: [0, yMax / 2, yMax].map((v) => +v.toFixed(0)),
      xLabel: "세대",
      yLabel: "최고 숙련도",
      faint: runs,
      main,
      ...rest,
    };
  };

  /* ---------- 인구와 복잡도 ---------- */
  {
    const GENS = 40,
      START = 10,
      RUNS = 8;
    Sims.define("population", {
      controls: [
        {
          key: "n",
          label: "배우는 사람 수 N",
          min: 1,
          max: 5,
          step: 0.01,
          value: 2,
          read: fromLog10,
          show: peopleExact,
        },
        {
          key: "alpha",
          label: "기술 복잡도 α",
          min: 2,
          max: 14,
          step: 0.1,
          value: 7,
          show: fixed1,
        },
      ],
      readouts: [{ key: "nstar", label: "임계 인구 N*" }],
      status: true,
      // 100명(퇴보) → N* 근처 약 600명(겨우 유지) → 1만 명(발전). n은 log10 값
      steps: [
        { n: 2, alpha: 7 },
        { n: 2.79, alpha: 7 },
        { n: 4, alpha: 7 },
      ],
      render({ n, alpha }, ui) {
        const dz = deltaZ(alpha, n);
        trend(ui, dz);
        const runs = runMany(RUNS, 11, {
          gens: GENS,
          pop: () => n,
          alpha,
          start: START,
        });
        const expected = Array.from({ length: GENS + 1 }, (_, t) => [
          t,
          Math.max(0, START + dz * t),
        ]);
        ui.chart(
          levelChart({
            gens: GENS,
            xTicks: [0, 10, 20, 30, 40],
            runs,
            main: expected,
            floor: 20,
          })
        );
      },
    });
  }

  /* ---------- 반복되는 참사 (질문 1) ----------
     EVERY세대마다 참사가 인구를 cut만큼 줄인다. 그사이 출산율 TFR로 인구가 늘지만 거주지 한계(START_POP)를 넘지 못한다.
     참사가 작으면 회복이 따라잡고, 크면 인구가 점점 줄어든다.
     인구가 임계 인구 N* 아래로 내려가면 기술이 줄기 시작하고, 0이 되면 가르칠 사람이 없어 되살아나지 않는다. */
  {
    const START_POP = 10000,
      ALPHA = 9.2, // 임계 인구 약 5,560명
      TFR = 2.1,
      EVERY = 6,
      GENS = 60,
      TRIALS = 40,
      SHOWN = 14;
    const critical = nStar(ALPHA);
    // 세대별 인구. 세대마다 출산율/2를 곱하되 거주지 한계를 넘지 않고, EVERY세대마다 참사로 줄인다.
    const popSeries = (cut) => {
      const out = [];
      let p = START_POP;
      for (let t = 0; t <= GENS; t++) {
        if (t > 0) {
          p = Math.min(START_POP, (p * TFR) / 2);
          if (t % EVERY === 0) p *= 1 - cut;
        }
        out.push(Math.max(2, Math.round(p)));
      }
      return out;
    };
    Sims.define("catastrophe", {
      controls: [
        {
          key: "cut",
          label: `참사 규모 (${EVERY}세대마다)`,
          min: 0,
          max: 50,
          step: 1, // 1% 단위여야 발표 단계로 넘길 때 슬라이더가 부드럽게 움직인다
          value: 20,
          read: (v) => v / 100,
          show: percent,
        },
      ],
      readouts: [
        { key: "end", label: `${GENS}세대 뒤 인구` },
        { key: "lost", label: `영구 소실 (${TRIALS}회 중)` },
      ],
      status: true,
      // 20%(인구 회복, 0% 소실) → 30%(인구 약 3,900명, 3% 소실) → 40%(인구 약 840명, 100% 소실)
      steps: [{ cut: 20 }, { cut: 30 }, { cut: 40 }],
      note: `인구 ${group(START_POP)}명(거주지 한계), 출산율 ${TFR}, α = ${ALPHA}, 임계 인구 약 ${group(
        Math.round(critical / 10) * 10
      )}명`,
      render({ cut }, ui) {
        const pops = popSeries(cut);
        const all = runMany(TRIALS, 101, { gens: GENS, pop: (t) => pops[t], alpha: ALPHA });
        const frac = all.filter((r) => r[GENS] === 0).length / TRIALS;
        const runs = all.slice(0, SHOWN); // 그래프에는 일부만 그린다
        ui.set("end", people(pops[GENS]));
        ui.set("lost", percent(frac));
        if (frac < 0.1) ui.status("지킴");
        else if (frac < 0.6) ui.status("운에 달림");
        else ui.status("영구 소실", true);
        // 인구가 임계 인구 아래로 내려간 뒤를 음영으로 표시한다
        const below = pops.findIndex((p) => p < critical);
        ui.chart(
          levelChart({
            gens: GENS,
            xTicks: [0, 10, 20, 30, 40, 50, 60],
            runs,
            main: mean(runs),
            floor: 100, // 슬라이더 범위(0~50%)에서 숙련도 최댓값이 약 64라 세로축이 100으로 고정된다
            bands: below < 0 ? [] : [{ from: below, to: GENS, label: "인구 < 임계 인구" }],
          })
        );
      },
    });
  }
})();
