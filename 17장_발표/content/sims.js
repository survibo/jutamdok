/* 시뮬레이션 설정. 숫자(기본 인구, α 등)는 각 블록 맨 위에서 고친다.
   왼쪽 글은 content/slides.js에 있다. */
(() => {
  const { nStar, deltaZ, runMany, group } = Model;
  const fixed1 = (x) => x.toFixed(1);
  const fromLog10 = (v) => Math.round(Math.pow(10, v)); // 인구 슬라이더는 로그 눈금
  const peopleExact = (n) => group(n) + "명";

  /* Δz 값에 따른 상태 표시 */
  const trend = (ui, dz) => {
    if (dz > 0.05) ui.status("발전");
    else if (dz < -0.05) ui.status("퇴보 → 소실", true);
    else ui.status("겨우 유지");
  };

  /* '세대별 숙련도' 그래프 */
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
      readouts: [{ key: "nstar", label: "임계 인원 N*" }],
      status: true,
      // 100명(퇴보) → N* 근처 약 600명(겨우 유지) → 1만 명(발전). n은 log10 값
      steps: [
        { n: 2, alpha: 7 },
        { n: 2.79, alpha: 7 },
        { n: 4, alpha: 7 },
      ],
      render({ n, alpha }, ui) {
        const dz = deltaZ(alpha, n);
        ui.set("nstar", peopleExact(Math.round(nStar(alpha))));
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

})();
