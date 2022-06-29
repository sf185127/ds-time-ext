const PROJECTS: [string, number][] = [
  ["Mobile Banking Core:   ", 0.2],
  ["CSP Foundation:        ", 0.2],
  ["Aloha Upgrades:        ", 0.2],
  ["Back Office:           ", 0.2],
  ["IT Service:            ", 0.1],
  ["Next Generation:       ", 0.1],
  // ["Digital Banking - R&D - Digital Banking - Mobile Banking Core", 0.2],
  // ["CX Banking - R&D - CSP Foundation (TxInfinity)", 0.2],
  // [
  //   "Hospitality -  R&D - Aloha POS - Aloha Upgrades - Roadmap Enhancements – Hospitality",
  //   0.2,
  // ],
  // [
  //   "Silver - R&D - Silver - Back Office - Roadmap Enhancements - Hospitality",
  //   0.2,
  // ],
  // ["R&D - DCS - RET, IT Service Management", 0.1],
  // ["Retail - R&D Next Generation SCO", 0.1],
];

const calcHours = (totalHours: number, dsHours: number) => {
  const outsideHours = totalHours - dsHours;

  console.log("Calculating hours for each project...");
  const initialCalcs = PROJECTS.map(
    ([name, portion]) => [name, Math.ceil(portion * outsideHours)] as const
  );
  const initialCalcsTotal = initialCalcs.reduce((pv, [_, hrs]) => pv + hrs, 0);
  let finalCalcs = [...initialCalcs];
  let overflowing = initialCalcsTotal - outsideHours;
  let idx = 4; // start at the smallest percentage
  while (overflowing > 0) {
    let currentIdx = idx % finalCalcs.length;
    if (finalCalcs[currentIdx][1] === 0) continue;
    finalCalcs[currentIdx] = [
      finalCalcs[currentIdx][0],
      finalCalcs[currentIdx][1] - 1,
    ];
    idx++;
    overflowing--;
  }

  console.log(
    `
Summary
--------
Total hours worked:    ${totalHours}
Capex hours worked:    ${outsideHours}
DS hours worked:       ${dsHours}
--------
Project Breakdown:
--------
${finalCalcs
  .map(([name, value]) => {
    return `${name}${value}`;
  })
  .join("\n")}
*Design System*:       ${dsHours}
--------
`
  );

  return finalCalcs;
};

export default calcHours;
