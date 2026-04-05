// src/pages/AddGuessingChart.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { api } from "../lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HINDI_DAYS = {
  Monday: "सोम", Tuesday: "मंगल", Wednesday: "बुध",
  Thursday: "गुरु", Friday: "शुक्र", Saturday: "शनि", Sunday: "रवि",
};
const NUM_COLS = 4; // 4 columns per day row (as per image)

const emptyCol = () => ({ panel: "", jodi: "", digit: "" });
const emptyEntry = (day) => ({ day, columns: Array.from({ length: NUM_COLS }, emptyCol) });

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
};

export default function AddGuessingChart() {
  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [noOfDays, setNoOfDays] = useState(7);
  const [weekStartDate, setWeekStartDate] = useState(getMonday(new Date()));
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all games from existing API
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await api("/AllGames/");
        if (data.success) setGames(data.data.filter((g) => g.status === "Active"));
      } catch (err) {
        toast.error("Failed to load games");
      }
    };
    fetchGames();
  }, []);

  // When game or noOfDays changes, rebuild entries (or load existing)
  useEffect(() => {
    if (!selectedGameId) return;
    const days = ALL_DAYS.slice(0, Number(noOfDays));
    setLoading(true);

    api(`AllGames/guessing/${selectedGameId}`)
      .then((data) => {
        if (data.success && data.data) {
          // Pre-fill from saved data
          const saved = data.data;
          const filled = days.map((day) => {
            const existing = (saved.entries || []).find((e) => e.day === day);
            if (existing) {
              // Ensure exactly NUM_COLS columns
              const cols = [...(existing.columns || [])];
              while (cols.length < NUM_COLS) cols.push(emptyCol());
              return { day, columns: cols.slice(0, NUM_COLS) };
            }
            return emptyEntry(day);
          });
          setEntries(filled);
          setNoOfDays(saved.noOfDays || noOfDays);
          setWeekStartDate(saved.weekStartDate?.split("T")[0] || weekStartDate);
        } else {
          setEntries(days.map(emptyEntry));
        }
      })
      .catch(() => {
        setEntries(days.map(emptyEntry));
      })
      .finally(() => setLoading(false));
  }, [selectedGameId]);

  // Rebuild entries when noOfDays changes
  useEffect(() => {
    const days = ALL_DAYS.slice(0, Number(noOfDays));
    setEntries((prev) => {
      return days.map((day) => {
        const existing = prev.find((e) => e.day === day);
        return existing || emptyEntry(day);
      });
    });
  }, [noOfDays]);

  const updateCol = (dayIndex, colIndex, field, value) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[dayIndex] = {
        ...updated[dayIndex],
        columns: updated[dayIndex].columns.map((col, ci) =>
          ci === colIndex ? { ...col, [field]: value } : col
        ),
      };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedGameId) { toast.error("Please select a game"); return; }
    setSaving(true);
    try {
      const res = await api("/AllGames/save", {
        method: "POST",
        body: JSON.stringify({ gameId: selectedGameId, noOfDays, weekStartDate, entries }),
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
    <div style={{ backgroundColor: "#ffcc99", minHeight: "100vh" }}>
      <Header />

      <div style={{
        backgroundColor: "#c0392b", color: "#fff",
        textAlign: "center", padding: "10px", margin: "6px",
        borderRadius: "6px", fontWeight: "800", fontSize: "18px",
      }}>
        ADD GUESSING CHART
      </div>

      {/* Controls */}
      <div style={{
        background: "#fff", margin: "8px", padding: "14px",
        borderRadius: "8px", border: "2px solid #c0392b",
        display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end",
      }}>
        {/* Game Dropdown */}
        <div style={{ flex: "1 1 200px" }}>
          <label style={{ fontWeight: "700", display: "block", marginBottom: 4 }}>
            Select Game
          </label>
          <select
            className="form-control"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">-- Select Game --</option>
            {games.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* No of Days */}
        <div style={{ flex: "1 1 120px" }}>
          <label style={{ fontWeight: "700", display: "block", marginBottom: 4 }}>
            No of Days
          </label>
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

        {/* Week Start */}
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ fontWeight: "700", display: "block", marginBottom: 4 }}>
            Week Starting (Monday)
          </label>
          <input
            type="date"
            className="form-control"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !selectedGameId}
          style={{
            backgroundColor: saving ? "#aaa" : "#27ae60",
            color: "#fff", border: "none", borderRadius: "6px",
            padding: "10px 28px", fontWeight: "800", fontSize: "15px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "SAVE"}
        </button>
      </div>

      {/* Table */}
      {selectedGameId && !loading && (
        <div style={{ margin: "8px", overflowX: "auto" }}>
          {/* Game Name Header */}
          <div style={{
            background: "#f1c40f", color: "#c0392b",
            textAlign: "center", padding: "8px",
            fontWeight: "900", fontSize: "20px",
            fontStyle: "italic", borderRadius: "6px 6px 0 0",
            border: "2px solid #c0392b",
          }}>
            {selectedGame?.name || ""}
          </div>

          <table style={{
            width: "100%", borderCollapse: "collapse",
            backgroundColor: "#ffcc99", border: "2px solid #c0392b",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#c0392b", color: "#fff" }}>
                <th style={thStyle}>Day</th>
                {Array.from({ length: NUM_COLS }).map((_, ci) => (
                  <th key={ci} colSpan={3} style={thStyle}>Column {ci + 1}</th>
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
                  {/* Day name */}
                  <td style={{
                    ...tdStyle, backgroundColor: "#fff3cd",
                    fontWeight: "800", fontSize: "15px", minWidth: "60px",
                  }}>
                    <div>{HINDI_DAYS[entry.day]}</div>
                    <div style={{ fontSize: "10px", color: "#888" }}>{entry.day.slice(0, 3)}</div>
                  </td>

                  {entry.columns.map((col, ci) => (
                    <React.Fragment key={ci}>
                      {/* Panel */}
                      <td style={tdStyle}>
                        <input
                          style={inputStyle}
                          maxLength={3}
                          placeholder="689"
                          value={col.panel}
                          onChange={(e) => updateCol(di, ci, "panel", e.target.value)}
                        />
                      </td>
                      {/* Digit */}
                      <td style={tdStyle}>
                        <input
                          style={{ ...inputStyle, width: "36px", fontWeight: "900",
                            fontSize: "18px", color: "#c0392b", textAlign: "center" }}
                          maxLength={1}
                          placeholder="3"
                          value={col.digit}
                          onChange={(e) => updateCol(di, ci, "digit", e.target.value)}
                        />
                      </td>
                      {/* Jodi */}
                      <td style={tdStyle}>
                        <input
                          style={inputStyle}
                          maxLength={2}
                          placeholder="35"
                          value={col.jodi}
                          onChange={(e) => updateCol(di, ci, "jodi", e.target.value)}
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Save */}
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? "#aaa" : "#c0392b",
                color: "#fff", border: "none", borderRadius: "6px",
                padding: "12px 40px", fontWeight: "800", fontSize: "16px",
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
        <div style={{ textAlign: "center", padding: "30px", color: "#c0392b", fontWeight: "700" }}>
          Loading existing data...
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

// ── Styles ──
const thStyle = {
  padding: "6px 4px", textAlign: "center",
  border: "1px solid #fff", fontSize: "12px",
};

const tdStyle = {
  padding: "4px", textAlign: "center",
  border: "1px solid #c0392b", verticalAlign: "middle",
};

const inputStyle = {
  width: "52px", padding: "4px 2px", textAlign: "center",
  border: "1px solid #c0392b", borderRadius: "4px",
  fontSize: "13px", fontWeight: "700", backgroundColor: "#fff",
};