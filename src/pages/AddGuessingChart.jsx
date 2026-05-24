import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const NUM_COLS = 4;
const DEFAULT_PANEL_COLOR = "#f2c38b";
const DEFAULT_TEXT_COLOR = "#000000";

const emptyCol = () => ({ panel: "", jodi: "", digit: "" });

const emptyEntry = (day) => ({
  day,
  columns: Array.from({ length: NUM_COLS }, emptyCol),
});

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
};

const getPanelDigit = (panel) => {
  if (!/^\d{3}$/.test(panel)) return "";

  const total = panel
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);

  return String(total % 10);
};

const getJodiWithDigit = (value, digit) => {
  if (!digit) return value.replace(/\D/g, "").slice(0, 2);

  const numbersOnly = value.replace(/\D/g, "");
  const manualDigit = numbersOnly.startsWith(digit)
    ? numbersOnly.slice(1, 2)
    : numbersOnly.slice(-1);

  return `${digit}${manualDigit || ""}`;
};

const normalizeEntries = (savedEntries = [], days = []) => {
  return days.map((day) => {
    const existing = savedEntries.find((e) => e.day === day);

    if (!existing) {
      return emptyEntry(day);
    }

    const cols = Array.from({ length: NUM_COLS }, (_, index) => ({
      ...emptyCol(),
      ...(existing.columns?.[index] || {}),
    }));

    return {
      day,
      columns: cols,
    };
  });
};

const getIdValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.$oid) return value.$oid;
  if (value._id) return getIdValue(value._id);
  return String(value);
};

const toDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.split("T")[0];

  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const getSavedChartFromResponse = (response) => {
  if (!response) return null;

  const possibleData = [
    response.data,
    response.chart,
    response.guessingChart,
    response.result,
    response.data?.chart,
    response.data?.guessingChart,
    response.data?.result,
  ];

  return possibleData.find((item) => item && !Array.isArray(item)) || null;
};

const findSavedChartForGame = (charts = [], gameId, weekStartDate) => {
  const selectedWeek = toDateInputValue(weekStartDate);
  const gameCharts = charts.filter((chart) => {
    const chartGameId = getIdValue(chart.gameId);
    return chartGameId === gameId;
  });

  if (selectedWeek) {
    const weekMatch = gameCharts.find(
      (chart) => toDateInputValue(chart.weekStartDate) === selectedWeek,
    );

    if (weekMatch) return weekMatch;
  }

  return gameCharts.sort((a, b) => {
    const dateA = new Date(a.weekStartDate || a.updatedAt || 0).getTime();
    const dateB = new Date(b.weekStartDate || b.updatedAt || 0).getTime();
    return dateB - dateA;
  })[0];
};

export default function AddGuessingChart() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [noOfDays, setNoOfDays] = useState(7);
  const [weekStartDate, setWeekStartDate] = useState(getMonday(new Date()));
  const [entries, setEntries] = useState([]);
  const [panelColor, setPanelColor] = useState(DEFAULT_PANEL_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("authToken");

  let username = null;
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
      username = decoded.username;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await api("/AllGames/");

        if (data.success) {
          const activeGames = data.data.filter((g) => g.status === "Active");
          const allowedGames =
            role === "Admin"
              ? activeGames
              : activeGames.filter((g) => g.owner === username);

          setGames(allowedGames);
        }
      } catch (err) {
        toast.error("Failed to load games");
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    if (!selectedGameId || !weekStartDate) return;

    const fetchGuessingChart = async () => {
      setLoading(true);

      try {
        const selectedGame = games.find((g) => g._id === selectedGameId);
        const loadSavedChart = (saved) => {
          const daysCount = Number(
            saved.noOfDays || selectedGame?.noOfDays || noOfDays,
          );
          const days = ALL_DAYS.slice(0, daysCount);
          const savedWeekStartDate = toDateInputValue(saved.weekStartDate);

          setNoOfDays(daysCount);
          if (savedWeekStartDate) {
            setWeekStartDate(savedWeekStartDate);
          }
          setPanelColor(saved.panelColor || DEFAULT_PANEL_COLOR);
          setTextColor(saved.textColor || DEFAULT_TEXT_COLOR);
          setIsActive(saved.isActive !== false);
          setEntries(normalizeEntries(saved.entries || [], days));
        };

        const loadBlankChart = () => {
          const daysCount = Number(selectedGame?.noOfDays || noOfDays);
          const days = ALL_DAYS.slice(0, daysCount);

          setNoOfDays(daysCount);
          setPanelColor(DEFAULT_PANEL_COLOR);
          setTextColor(DEFAULT_TEXT_COLOR);
          setIsActive(true);
          setEntries(days.map(emptyEntry));
        };

        const data = await api(
          `/AllGames/guessing/${selectedGameId}?weekStartDate=${weekStartDate}`,
        );
        const savedChart =
          getSavedChartFromResponse(data) ||
          (Array.isArray(data.data)
            ? findSavedChartForGame(data.data, selectedGameId, weekStartDate)
            : null);

        if (data.success && savedChart) {
          loadSavedChart(savedChart);
        } else {
          const allCharts = await api("/AllGames/all");
          const fallbackSavedChart =
            allCharts.success && Array.isArray(allCharts.data)
              ? findSavedChartForGame(
                  allCharts.data,
                  selectedGameId,
                  weekStartDate,
                )
              : null;

          if (fallbackSavedChart) {
            loadSavedChart(fallbackSavedChart);
          } else {
            loadBlankChart();
          }
        }
      } catch (err) {
        const selectedGame = games.find((g) => g._id === selectedGameId);
        const daysCount = Number(selectedGame?.noOfDays || noOfDays);
        const days = ALL_DAYS.slice(0, daysCount);

        setNoOfDays(daysCount);
        setPanelColor(DEFAULT_PANEL_COLOR);
        setTextColor(DEFAULT_TEXT_COLOR);
        setIsActive(true);
        setEntries(days.map(emptyEntry));
      } finally {
        setLoading(false);
      }
    };

    fetchGuessingChart();
  }, [selectedGameId, weekStartDate, games]);

  useEffect(() => {
    const days = ALL_DAYS.slice(0, Number(noOfDays));

    setEntries((prev) =>
      days.map((day) => {
        const existing = prev.find((e) => e.day === day);
        return existing || emptyEntry(day);
      }),
    );
  }, [noOfDays]);

  const updateCol = (dayIndex, colIndex, field, value) => {
    setEntries((prev) => {
      const updated = [...prev];

      updated[dayIndex] = {
        ...updated[dayIndex],
        columns: updated[dayIndex].columns.map((col, ci) => {
          if (ci !== colIndex) return col;

          if (field === "panel") {
            const panel = value.replace(/\D/g, "").slice(0, 3);
            const digit = getPanelDigit(panel);

            return {
              ...col,
              panel,
              digit,
              jodi: digit ? getJodiWithDigit(col.jodi || digit, digit) : "",
            };
          }

          if (field === "jodi") {
            return {
              ...col,
              jodi: getJodiWithDigit(value, col.digit),
            };
          }

          return { ...col, [field]: value };
        }),
      };

      return updated;
    });
  };

  const handleClearAll = () => {
    const days = ALL_DAYS.slice(0, Number(noOfDays));
    setEntries(days.map(emptyEntry));
  };

  const handleResetColors = () => {
    setPanelColor(DEFAULT_PANEL_COLOR);
    setTextColor(DEFAULT_TEXT_COLOR);
  };

  const handleSave = async () => {
    if (!selectedGameId) {
      toast.error("Please select a game");
      return;
    }

    setSaving(true);

    try {
      const res = await api("/AllGames/save", {
        method: "POST",
        body: JSON.stringify({
          gameId: selectedGameId,
          noOfDays,
          weekStartDate,
          panelColor,
          textColor,
          isActive,
          entries,
        }),
      });

      if (res.success) {
        toast.success("Guessing chart saved successfully!");
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedGame = games.find((g) => g._id === selectedGameId);

  return (
    <div style={{ backgroundColor: DEFAULT_PANEL_COLOR, minHeight: "100vh" }}>
      {/* <Header /> */}

      <div
        style={{
          backgroundColor: "#c0392b",
          color: "#fff",
          textAlign: "center",
          padding: "10px",
          margin: "6px",
          borderRadius: "6px",
          fontWeight: "800",
          fontSize: "18px",
        }}
      >
        ADD GUESSING CHART
      </div>

      <div
        style={{
          background: "#fff",
          margin: "8px",
          padding: "14px",
          borderRadius: "8px",
          border: "2px solid #c0392b",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <label style={labelStyle}>Select Game</label>
          <select
            className="form-control"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">-- Select Game --</option>
            {games.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>No of Days</label>
          <select
            className="form-control"
            value={noOfDays}
            onChange={(e) => setNoOfDays(Number(e.target.value))}
          >
            <option value={5}>5 Days</option>
            <option value={6}>6 Days</option>
            <option value={7}>7 Days</option>
          </select>
        </div>

        <div style={{ flex: "1 1 160px" }}>
          <label style={labelStyle}>Week Starting Monday</label>
          <input
            type="date"
            className="form-control"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
          />
        </div>

        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Panel Color</label>
          <input
            type="color"
            className="form-control"
            value={panelColor}
            onChange={(e) => setPanelColor(e.target.value)}
          />
        </div>

        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Text Color</label>
          <input
            type="color"
            className="form-control"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleResetColors}
          style={{
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            fontWeight: "800",
            fontSize: "15px",
          }}
        >
          RESET COLORS
        </button>

        <div style={{ flex: "1 1 120px" }}>
          <label style={labelStyle}>Status</label>
          <button
            type="button"
            onClick={() => setIsActive((prev) => !prev)}
            style={{
              backgroundColor: isActive ? "#27ae60" : "#777",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontWeight: "800",
              width: "100%",
            }}
          >
            {isActive ? "Active" : "Inactive"}
          </button>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={!selectedGameId || loading}
          style={{
            backgroundColor: !selectedGameId || loading ? "#aaa" : "#34495e",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 22px",
            fontWeight: "800",
            fontSize: "15px",
            cursor: !selectedGameId || loading ? "not-allowed" : "pointer",
          }}
        >
          CLEAR ALL
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !selectedGameId}
          style={{
            backgroundColor: saving ? "#aaa" : "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 28px",
            fontWeight: "800",
            fontSize: "15px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "SAVE"}
        </button>
      </div>

      {selectedGameId && !loading && (
        <div style={{ margin: "8px", overflowX: "auto" }}>
          <div
            style={{
              background: "#f1c40f",
              color: "#c0392b",
              textAlign: "center",
              padding: "8px",
              fontWeight: "900",
              fontSize: "20px",
              fontStyle: "italic",
              borderRadius: "6px 6px 0 0",
              border: "2px solid #c0392b",
            }}
          >
            {selectedGame?.name || ""}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: panelColor!==undefined ?  panelColor : "#ffcc99" ,
              border: "2px solid #c0392b",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#c0392b", color: "#fff" }}>
                <th style={thStyle}>Day</th>
                {Array.from({ length: NUM_COLS }).map((_, ci) => (
                  <th key={ci} colSpan={3} style={thStyle}>
                    Column {ci + 1}
                  </th>
                ))}
              </tr>

              <tr style={{ backgroundColor: "#e74c3c", color: "#fff" }}>
                <th style={thStyle}></th>
                {Array.from({ length: NUM_COLS }).map((_, ci) => (
                  <React.Fragment key={ci}>
                    <th style={thStyle}>Panel</th>
                    <th style={thStyle}>Digit</th>
                    <th style={thStyle}>Jodi</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {entries.map((entry, di) => (
                <tr key={entry.day} style={{ borderBottom: "1px solid #c0392b" }}>
                  <td
                    style={{
                      ...tdStyle,
                      backgroundColor: "#fff3cd",
                      color: "rgb(0, 255, 0)",
                      fontWeight: "800",
                      fontSize: "15px",
                      minWidth: "60px",
                    }}
                  >
                    <div>{HINDI_DAYS[entry.day]}</div>
                    <div style={{ fontSize: "10px", color: "rgb(0, 255, 0)" }}>
                      {entry.day.slice(0, 3)}
                    </div>
                  </td>

                  {entry.columns.map((col, ci) => (
                    <React.Fragment key={ci}>
                      <td style={tdStyle}>
                        <input
                          style={{
                            ...inputStyle,
                            backgroundColor: panelColor,
                            color: textColor,
                          }}
                          maxLength={3}
                          placeholder="000"
                          value={col.panel || ""}
                          onChange={(e) =>
                            updateCol(di, ci, "panel", e.target.value)
                          }
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          style={{
                            ...inputStyle,
                            width: "36px",
                            fontWeight: "900",
                            fontSize: "18px",
                            backgroundColor: panelColor,
                            color: textColor,
                            textAlign: "center",
                          }}
                          maxLength={1}
                          placeholder="0"
                          value={col.digit || ""}
                          readOnly
                        />
                      </td>

                      <td style={tdStyle}>
                        <input
                          style={{
                            ...inputStyle,
                            backgroundColor: panelColor,
                            color: textColor,
                          }}
                          maxLength={2}
                          placeholder="00"
                          value={col.jodi || ""}
                          onChange={(e) =>
                            updateCol(di, ci, "jodi", e.target.value)
                          }
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={saving}
              style={{
                backgroundColor: saving ? "#aaa" : "#34495e",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 32px",
                fontWeight: "800",
                fontSize: "16px",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                marginRight: "8px",
              }}
            >
              CLEAR ALL
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? "#aaa" : "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "12px 40px",
                fontWeight: "800",
                fontSize: "16px",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
              }}
            >
              {saving ? "Saving..." : "SAVE CHART"}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "#c0392b",
            fontWeight: "700",
          }}
        >
          Loading existing data...
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

const labelStyle = {
  fontWeight: "700",
  display: "block",
  marginBottom: 4,
};

const thStyle = {
  padding: "6px 4px",
  textAlign: "center",
  border: "1px solid #fff",
  fontSize: "12px",
};

const tdStyle = {
  padding: "4px",
  textAlign: "center",
  border: "1px solid #c0392b",
  verticalAlign: "middle",
};

const inputStyle = {
  width: "52px",
  padding: "4px 2px",
  textAlign: "center",
  border: "1px solid #c0392b",
  borderRadius: "4px",
  fontSize: "13px",
  fontWeight: "700",
};
