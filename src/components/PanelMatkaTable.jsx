import React from "react";

const styles = `

  .cell {
  position: relative;
}

.edit-cell-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}


  .panel-table-wrapper {
    width: 100%;
    padding: 0 2px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .go-bottom, .go-up {
    display: inline-block;
    margin: 8px 6px;
    background: #be4335;
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.3px;
  }

  .compact-table-box {
    width: 100%;
    overflow-x: hidden; /* NO horizontal scroll */
  }

  .matka-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* forces equal column widths, no overflow */
  }

  /* ── Title row ── */
  .compact-title {
    background: #c0392b;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    padding: 7px 4px;
    letter-spacing: 0.3px;
    text-align: center;
  }

  /* ── Day header ── */
  .compact-day {
    background: #222;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 2px;
    text-align: center;
    border: 1px solid #444;
  }

  /* ── Week cell ── */
  .week-cell {
    background: #0c0c0c;
    border: 1px solid #ffffff;
    vertical-align: middle;
    text-align: center;
    padding: 3px 2px;
    word-break: break-word;
  }

  .week-date-text {
    font-size: 9.5px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    display: block;
  }

  .week-to-text {
    font-size: 8px;
    color: #fcfbfb;
    display: block;
  }

  /* ── Data cell ── */
  .cell {
    border: 1px solid #ffffff;
    padding: 3px 1px;
    text-align: center;
    vertical-align: middle;
    background: #000000;
    color: #ffffff
  }

  /* Cell inner layout: left digits | jodi | right digits */
  .data-of-jodi-open-close {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1px;
    width: 100%;
  }

  /* Left col: open digits stacked vertically */
  .panel-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0px;
  }

  /* Right col: close digits stacked vertically */
  .panel-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0px;
  }

  .panel-left span,
  .panel-right span {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.35;
  }

  /* Jodi center */
  .big-jodi {
    font-size: 13px;
    font-weight: 900;
    color: #ffffff;
    text-align: center;
    line-height: 1;
  }

  .big-jodi.red {
    color: #c0392b;
  }

  .empty-slot {
    color: #ffffff;
    font-size: 11px;
  }

  /* ───────────────────────────────────────────
     MOBILE: squeeze everything to fit screen
     ─────────────────────────────────────────── */
  @media (max-width: 480px) {
    .compact-title {
      font-size: 9px;
      padding: 5px 2px;
    }

    .compact-day {
      font-size: 8px;
      padding: 3px 1px;
    }

    .week-date-text {
      font-size: 7.5px;
    }

    .week-to-text {
      font-size: 6.5px;
    }

    .panel-left span,
    .panel-right span {
      font-size: 7.5px;
    }

    .big-jodi {
      font-size: 10px;
    }

    .cell {
      padding: 2px 0px;
    }

    .week-cell {
      padding: 2px 1px;
    }

    .go-bottom, .go-up {
      font-size: 11px;
      padding: 6px 12px;
    }
  }

  @media (max-width: 360px) {
    .compact-title {
      font-size: 8px;
    }

    .compact-day {
      font-size: 7px;
    }

    .week-date-text {
      font-size: 6.5px;
    }

    .panel-left span,
    .panel-right span {
      font-size: 7px;
    }

    .big-jodi {
      font-size: 9px;
    }
  }
`;

export default function PanelMatkaTable({
  groupedData = {},
  groupedByDayOpen = {},
  baseDateFromData,
  gameName = "",
  noOfDays = 7,
  canEditResults = false,
  onEditResult,
}) {
  const nd = Number(noOfDays);
  let daysCount = 7;
  if (Number.isFinite(nd)) {
    if (nd === 7) daysCount = 7;
    else if (nd === 6) daysCount = 6;
    else daysCount = 5;
  }

  const daysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const headers = ["Week", ...daysShort.slice(0, daysCount)];

  const dayMap = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  const baseDate = new Date(baseDateFromData);

  // Short date: DD/MM for mobile, DD-MM-YY for tablet+
  const formatDateShort = (date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = String(date.getFullYear()).slice(2);
    return `${d}/${m}/${y}`;
  };

  const getWeekIndex = (entryDate, mondayBase) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = (entryDate - mondayBase) / msPerDay;
    return Math.floor(diff / 7);
  };

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  const mondayBaseDate = getMonday(baseDate);

  const weekData = {};

  Object.keys(groupedByDayOpen).forEach((day) => {
    (groupedByDayOpen[day] || []).forEach((entry) => {
      const date = new Date(entry[2]);
      const weekIndex = getWeekIndex(date, mondayBaseDate);
      if (!weekData[weekIndex]) weekData[weekIndex] = {};
      if (!weekData[weekIndex][day]) weekData[weekIndex][day] = {};
      weekData[weekIndex][day].open = entry;
    });
  });

  Object.keys(groupedData).forEach((day) => {
    (groupedData[day] || []).forEach((entry) => {
      const date = new Date(entry[2]);
      const weekIndex = getWeekIndex(date, mondayBaseDate);
      if (!weekData[weekIndex]) weekData[weekIndex] = {};
      if (!weekData[weekIndex][day]) weekData[weekIndex][day] = {};
      weekData[weekIndex][day].close = entry;
    });
  });

  const existingWeekIndexes = Object.keys(weekData)
    .map((n) => Number(n))
    .sort((a, b) => a - b);

  if (existingWeekIndexes.length === 0) {
    return <div>No data available</div>;
  }

  const minWeek = existingWeekIndexes[0];
  const maxWeek = existingWeekIndexes[existingWeekIndexes.length - 1];

  const weekIndexes = [];
  for (let w = minWeek; w <= maxWeek; w++) weekIndexes.push(w);

  const data = weekIndexes.map((weekIndex) => {
    const startOfWeek = new Date(mondayBaseDate);
    startOfWeek.setDate(mondayBaseDate.getDate() + weekIndex * 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekStartStr = formatDateShort(startOfWeek);
    const weekEndStr = formatDateShort(endOfWeek);

    const rowData = daysShort.slice(0, daysCount).map((shortDay, dayOffset) => {
      const fullDay = Object.keys(dayMap).find((k) => dayMap[k] === shortDay);
      const weekEntry = weekData[weekIndex] || {};
      const dayEntry = weekEntry[fullDay] || {};
      const openData = dayEntry.open || ["", "", ""];
      const closeData = dayEntry.close || ["", "", ""];

      const cellDate = new Date(startOfWeek);
      cellDate.setDate(startOfWeek.getDate() + dayOffset);

      const dateISOString =
        openData[2] || closeData[2] || cellDate.toISOString();

      const dateKey = String(dateISOString).split("T")[0];

      const jodi =
        openData[1] && closeData[1] ? `${openData[1]}${closeData[1]}` : "";

      return {
        openPanel: openData,
        jodi,
        closePanel: closeData,
        dateKey,
        dateISOString,
        dayName: fullDay,
      };
    });

    return { weekStartStr, weekEndStr, rowData };
  });

  const redNumbers = ["44", "50", "38", "99", "61", "05", "77", "88", "66"];

  return (
    <>
      {/* Inject scoped CSS */}
      <style>{styles}</style>

      <div className="panel-table-wrapper">
        <button
          className="go-bottom"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth",
            })
          }
        >
          Go to Bottom
        </button>

        {/* NO overflow-x: auto here — table-layout:fixed does the job */}
        <div className="compact-table-box">
          <table className="matka-table">
            <thead>
              <tr>
                <th colSpan={headers.length} className="compact-title">
                  {gameName} MATKA PANEL RECORD 2019 - 2025
                </th>
              </tr>
              <tr>
                {headers.map((day) => (
                  <th key={day} className="compact-day">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {/* Week column */}
                  <td className="week-cell">
                    <span className="week-date-text">{row.weekStartStr}</span>
                    <span className="week-to-text">to</span>
                    <span className="week-date-text">{row.weekEndStr}</span>
                  </td>

                  {/* Day columns */}
                  {row.rowData.map(
                    (
                      {
                        openPanel,
                        jodi,
                        closePanel,
                        dateKey,
                        dateISOString,
                        dayName,
                      },
                      colIndex,
                    ) => (
                      <td key={colIndex} className="cell">
                        {canEditResults && (
                          <button
                            type="button"
                            className="edit-cell-btn"
                            onClick={() =>
                              onEditResult({
                                dateKey,
                                dateISOString,
                                dayName,
                                openPanel: openPanel[0] || "",
                                openDigit: openPanel[1] || "",
                                closePanel: closePanel[0] || "",
                                closeDigit: closePanel[1] || "",
                              })
                            }
                          >
                            ✏️
                          </button>
                        )}
                        {openPanel[0] && closePanel[0] ? (
                          <div className="data-of-jodi-open-close">
                            {/* Open digits — stacked vertically on LEFT */}
                            <div className="panel-left">
                              {String(openPanel[0])
                                .split("")
                                .map((d, i) => (
                                  <span key={i}>{d}</span>
                                ))}
                            </div>

                            {/* Jodi — CENTER */}
                            <div
                              className={`big-jodi ${
                                redNumbers.includes(jodi) ? "red" : ""
                              }`}
                            >
                              {jodi || "-"}
                            </div>

                            {/* Close digits — stacked vertically on RIGHT */}
                            <div className="panel-right">
                              {String(closePanel[0])
                                .split("")
                                .map((d, i) => (
                                  <span key={i}>{d}</span>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="empty-slot">-</div>
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="go-up"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Go to Top
        </button>
      </div>
    </>
  );
}
