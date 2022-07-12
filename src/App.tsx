import "./App.css";
import {
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import React, { useCallback, useState } from "react";

function App() {
  const [outsideHours, setOutsideHours] = useState("40");
  const [dsHours, setDsHours] = useState("0");
  const [dayToggle, setDayToggle] = useState(() => ["0", "1", "2", "3", "4"]);

  const fill = useCallback(async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id === undefined) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [dsHours, outsideHours, dayToggle],
      func: async (dsHoursStr, outsideHoursStr, dayToggle) => {
        if (!dsHoursStr || Array.isArray(dsHoursStr)) return;
        if (!outsideHoursStr || Array.isArray(outsideHoursStr)) return;

        const dsHours = parseInt(dsHoursStr);
        const outsideHours = parseInt(outsideHoursStr);
        const totalHours = dsHours + outsideHours;

        const waitForSeconds = async (wait: number) =>
          await new Promise((resolve) => setTimeout(resolve, wait));

        const PROJECTS: [string, number][] = [
          ["R&D - Digital Banking - Mobile Banking Core", 0.2],
          ["R&D - CSP Foundation (TxInfinity)", 0.2],
          [
            "R&D - Aloha POS - Aloha Upgrades - Roadmap Enhancements - Hospitality",
            0.2,
          ],
          [
            "R&D - Silver - Back Office - Roadmap Enhancements - Hospitality",
            0.2,
          ],
          ["R&D - DCS - RET: IT Service Management", 0.1],
          ["R&D Next Generation SCO", 0.1],
        ];

        console.log("Calculating hours for each project...");
        const initialCalcs = PROJECTS.map(
          ([name, portion]) =>
            [name, Math.ceil(portion * outsideHours)] as const
        );
        const initialCalcsTotal = initialCalcs.reduce(
          (pv, [_, hrs]) => pv + hrs,
          0
        );
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
              return `${name}${value}:  `;
            })
            .join("\n")}
          --------
          `
        );

        var days: {
          [day: string]: {
            [project: string]: { field?: HTMLInputElement };
          };
        } = {};

        for (let p in finalCalcs) {
          const calc = finalCalcs[p];

          try {
            const handle = document
              .evaluate(`//*[contains(text(), "${calc[0]}")]`, document)
              ?.iterateNext() as HTMLElement;
            if (!handle) throw new Error("Handle not found");

            const row = document
              .evaluate(`ancestor::tr[1]`, handle)
              .iterateNext() as HTMLElement;
            if (!row) throw new Error("Row not found");

            //wait for dropdown
            await new Promise<HTMLElement | null>((resolve, reject) => {
              let overflow = 10;
              const check = () => {
                const nextRow = document
                  .evaluate(`following-sibling::tr[1]`, row)
                  .iterateNext() as HTMLElement;
                if (nextRow) {
                  if (
                    !nextRow.matches(
                      "tr[class^='task-row-'], tr[class*=' task-row-']"
                    ) ||
                    nextRow.style.display === "none"
                  ) {
                    handle.click();
                  } else {
                    resolve(nextRow);
                  }
                }
                if (--overflow > 0) setTimeout(check, 500);
                else reject();
              };
              check();
            });

            const featureRow = document
              .evaluate(
                `following-sibling::tr//*[contains(text(), "New Feature Development")]/ancestor::tr[1]`,
                row
              )
              .iterateNext() as HTMLElement;
            if (!featureRow) throw new Error("Feature row not found");

            const cells = document.evaluate(`td/input`, featureRow);
            //skip
            cells.iterateNext();
            for (let d = 0; d < 5; ++d) {
              days[d] = days[d] || {};
              days[d][p] = days[d][p] || {};

              const field = cells.iterateNext() as HTMLInputElement;
              days[d][p].field = field;
            }
          } catch (err) {
            console.error(err);
          }
        }

        console.log(days);

        //fill in values
        for (let p in finalCalcs) {
          let [_, pHours] = finalCalcs[parseInt(p)];
          if (pHours <= 0) break;

          for (let d in days) {
            if (!dayToggle.includes(d)) continue;
            if (pHours <= 0) break;

            const { field } = days[d][p];
            if (!field) continue;

            field.scrollIntoView();
            await waitForSeconds(50);

            let dHours = 0;
            for (let project of Object.keys(days[d])) {
              dHours += parseInt(days[d][project]?.field?.value || "0");
            }

            let aHours = 0;
            while (dHours < 8 && pHours > 0) {
              dHours++;
              pHours--;
              aHours++;
            }

            // This will work by calling the native setter bypassing Reacts incorrect value change check
            Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            )?.set?.call(field, aHours);
            // This will trigger a new render wor the component
            field.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      },
    });
  }, [dsHours, outsideHours, dayToggle]);

  console.log(dayToggle);

  return (
    <div className="flex flex-col space-y-3 px-3 py-5">
      <TextField
        label="DS Hours"
        value={dsHours}
        onChange={(e) => setDsHours(e.target.value)}
      />
      <TextField
        label="Outside Hours"
        value={outsideHours}
        onChange={(e) => setOutsideHours(e.target.value)}
      />
      <ToggleButtonGroup value={dayToggle} onChange={(e, v) => setDayToggle(v)}>
        <ToggleButton value="0" aria-label="bold">
          Mo
        </ToggleButton>
        <ToggleButton value="1" aria-label="bold">
          Tu
        </ToggleButton>
        <ToggleButton value="2" aria-label="bold">
          We
        </ToggleButton>
        <ToggleButton value="3" aria-label="bold">
          Th
        </ToggleButton>
        <ToggleButton value="4" aria-label="bold">
          Fr
        </ToggleButton>
      </ToggleButtonGroup>
      <Button
        variant="contained"
        onClick={() => {
          fill();
        }}
      >
        Fill
      </Button>
    </div>
  );
}

export default App;
