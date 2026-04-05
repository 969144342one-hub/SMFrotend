// src/pages/GuessingChartDisplay.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { api } from "../lib/api";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HINDI_DAYS = {
  Monday: "सोम", Tuesday: "मंगल", Wednesday: "बुध",
  Thursday: "गुरु", Friday: "शुक्र", Saturday: "शनि", Sunday: "रवि",
};

export default function GuessingChartDisplay() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const data = await api("/AllGames/all");
        if (data.success) setCharts(data.data);
        else setError("Failed to load charts");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  if (loading) return (
    <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh" }}>
      <Header />
      <div style={{ textAlign: "center", padding: "40px", color: "#c0392b", fontWeight: "700", fontSize: "18px" }}>
        Loading...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh" }}>
      <Header />
      <div style={{ textAlign: "center", padding: "40px", color: "red" }}>Error: {error}</div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh", padding: "4px" }}>
      <Header />

      <div style={{
        backgroundColor: "#c0392b", color: "#fff",
        textAlign: "center", padding: "10px", margin: "6px",
        borderRadius: "6px", fontWeight: "900", fontSize: "18px",
        letterSpacing: "1px",
      }}>
        SATTA MATKA GUESSING CHART
      </div>

      {charts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#c0392b", fontWeight: "700" }}>
          No guessing charts available yet.
        </div>
      )}

      {charts.map((chart) => (
        <GameChartSection key={chart._id} chart={chart} />
      ))}
    </div>
  );
}

// ── Single game chart section ──
function GameChartSection({ chart }) {
  const days = ALL_DAYS.slice(0, chart.noOfDays || 7);

  return (
    <div style={{ margin: "10px 4px", borderRadius: "8px", overflow: "hidden",
      border: "2px solid #c0392b", boxShadow: "0 3px 10px rgba(0,0,0,0.15)" }}>

      {/* Game Name Header */}
      <div style={{
        background: "#f1c40f", color: "#c0392b",
        textAlign: "center", padding: "10px 6px",
        fontWeight: "900", fontSize: "20px", fontStyle: "italic",
        letterSpacing: "0.5px",
      }}>
        {chart.gameName}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#ffcc99" }}>
          <tbody>
            {days.map((day) => {
              const entry = (chart.entries || []).find((e) => e.day === day);
              const cols = entry?.columns || [];

              return (
                <tr key={day} style={{ borderBottom: "1px solid #e0a87c" }}>
                  {/* Hindi Day Name */}
                  <td style={{
                    padding: "6px 8px", fontWeight: "900",
                    fontSize: "15px", color: "#000",
                    backgroundColor: "#ffeaa0",
                    border: "1px solid #c0392b",
                    textAlign: "center", minWidth: "48px",
                    whiteSpace: "nowrap",
                  }}>
                    {HINDI_DAYS[day]}
                  </td>

                  {/* 4 columns */}
                  {Array.from({ length: 4 }).map((_, ci) => {
                    const col = cols[ci] || { panel: "", jodi: "", digit: "" };
                    const hasData = col.panel || col.jodi || col.digit;

                    return (
                      <td key={ci} style={{
                        padding: "4px 6px", textAlign: "center",
                        border: "1px solid #c0392b",
                        verticalAlign: "middle", minWidth: "60px",
                      }}>
                        {hasData ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                            {/* Big digit */}
                            <span style={{
                              fontSize: "28px", fontWeight: "900",
                              color: "#000", lineHeight: 1,
                            }}>
                              {col.digit || "-"}
                            </span>

                            {/* Panel + Jodi stacked */}
                            <div style={{ display: "flex", flexDirection: "column",
                              alignItems: "flex-start", marginLeft: "2px" }}>
                              <span style={{
                                fontSize: "12px", fontWeight: "700",
                                color: "#1a237e", lineHeight: 1.3,
                              }}>
                                {col.panel || "---"}
                              </span>
                              <span style={{
                                fontSize: "12px", fontWeight: "700",
                                color: "#c0392b", lineHeight: 1.3,
                              }}>
                                {col.jodi || "--"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#ccc", fontSize: "12px" }}>-</span>
                        )}
                      </td>
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