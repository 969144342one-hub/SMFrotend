import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { api } from "../lib/api";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const HINDI_DAYS = {
  Monday: "सोम",
  Tuesday: "मंगल",
  Wednesday: "बुध",
  Thursday: "गुरु",
  Friday: "शुक्र",
  Saturday: "शनि",
  Sunday: "रवि",
};

export default function GuessingChartDisplay() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const data = await api("/AllGames/all");

        if (data.success) {
          setCharts(data.data);
        } else {
          setError("Failed to load charts");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh" }}>
        <Header />
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#c0392b",
            fontWeight: "700",
            fontSize: "18px",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh" }}>
        <Header />
        <div style={{ textAlign: "center", padding: "40px", color: "red" }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffcc99",
        minHeight: "100vh",
        padding: "4px",
      }}
    >
      <Header />

      <div
        style={{
          backgroundColor: "#c0392b",
          color: "#fff",
          textAlign: "center",
          padding: "10px",
          margin: "6px",
          borderRadius: "6px",
          fontWeight: "900",
          fontSize: "18px",
          letterSpacing: "1px",
        }}
      >
        SATTA MATKA GUESSING CHART
      </div>

      {charts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#c0392b",
            fontWeight: "700",
          }}
        >
          No guessing charts available yet.
        </div>
      )}

      {charts.map((chart) => (
        <GameChartSection key={chart._id} chart={chart} />
      ))}
    </div>
  );
}

function GameChartSection({ chart }) {
  const days = ALL_DAYS.slice(0, chart.noOfDays || 7);
  const panelColor = chart.panelColor && chart.panelColor.trim() !== "" ? chart.panelColor : "#ffe0bd";
  const textColor = chart.textColor && chart.textColor.trim() !== "" ? chart.textColor : "#c0392b";
  console.log(chart.panelColor);
  console.log(panelColor);
  
  
  return (
    <div
      style={{
        margin: "10px 4px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "2px solid #c0392b",
        boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          background: "#f1c40f",
          color: "#c0392b",
          textAlign: "center",
          padding: "10px 6px",
          fontWeight: "900",
          fontSize: "20px",
          fontStyle: "italic",
          letterSpacing: "0.5px",
        }}
      >
        {chart.gameName}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: panelColor,
          }}
        >
          <tbody>
            {days.map((day) => {
              const entry = (chart.entries || []).find((e) => e.day === day);
              const cols = entry?.columns || [];

              return (
                <tr key={day} style={{ borderBottom: "1px solid #e0a87c" }}>
                  <td
                    style={{
                      padding: "6px 8px",
                      fontWeight: "900",
                      fontSize: "15px",
                      color: "#000",
                      backgroundColor: panelColor,
                      border: "1px solid #c0392b",
                      textAlign: "center",
                      minWidth: "48px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {HINDI_DAYS[day]}
                  </td>

                  {Array.from({ length: 4 }).map((_, ci) => {
                    const col = cols[ci] || {
                      panel: "",
                      jodi: "",
                      digit: "",
                    };

                    const hasData = col.panel || col.jodi || col.digit;

                    return (
                      <React.Fragment key={ci}>
                        <td
                          style={{
                            padding: "4px 2px",
                            textAlign: "center",
                            border: "1px solid #c0392b",
                            verticalAlign: "middle",
                            minWidth: "28px",
                            backgroundColor: panelColor,
                          }}
                        >
                          {hasData ? (
                            <span
                              style={{
                                fontSize: "32px",
                                fontWeight: "900",
                                color: textColor,
                                lineHeight: 1,
                              }}
                            >
                              {col.digit || "-"}
                            </span>
                          ) : (
                            <span style={{ color: "#ccc", fontSize: "12px" }}>
                              -
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: "4px",
                            textAlign: "center",
                            border: "1px solid #c0392b",
                            verticalAlign: "middle",
                            minWidth: "48px",
                            backgroundColor: panelColor,
                          }}
                        >
                          {hasData ? (
                            <div
                              style={{
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #c0392b",
                                borderRadius: "3px",
                                backgroundColor: panelColor,
                                minWidth: "38px",
                                overflow: "hidden",
                              }}
                            >
                              <span
                                style={{
                                  width: "100%",
                                  padding: "2px 4px",
                                  fontSize: "15px",
                                  fontWeight: "700",
                                  color: textColor,
                                  lineHeight: 1.1,
                                  borderBottom: "1px solid #c0392b",
                                }}
                              >
                                {col.panel || "---"}
                              </span>

                              <span
                                style={{
                                  width: "100%",
                                  padding: "2px 4px",
                                  fontSize: "15px",
                                  fontWeight: "700",
                                  color: textColor,
                                  lineHeight: 1.1,
                                }}
                              >
                                {col.jodi || "--"}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "#ccc", fontSize: "12px" }}>
                              -
                            </span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
