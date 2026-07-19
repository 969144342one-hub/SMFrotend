// src/pages/PanelPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import Header from "../components/Header";
import PanelMatkaTable from "../components/PanelMatkaTable";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactDOM from "react-dom";
// import JodiPannelNotification from ''

import JodiPannelNotification from '../components/jodiPannelNotification'

const handleRefresh = () => {
  // Refresh the current page
  window.location.reload();
};

const handleCall = () => {
  // Opens dialer with number
  window.location.href =
    "https://api.whatsapp.com/send/?phone=919203516304&text=Welcome%21+Please+message+us+or+call+on+919691443421&type=phone_number&app_absent=0"; // ← replace with your number
};
const StaticButtons = () => {
  // Use a React Portal to render the buttons outside the normal DOM hierarchy.
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "10px",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "row",
        gap: "10px",
        width: "95%",
      }}
    >
      {/* 📞 Dial Pad Button */}
      <button
        onClick={handleCall}
        style={{
          padding: "8px 16px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          fontSize: "12px",
        }}
      >
        📞 WhatApp Admin
      </button>

      {/* 🔄 Refresh Page Button */}
      <button
        onClick={handleRefresh}
        style={{
          padding: "10px 20px",
          backgroundColor: "#008CBA",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          fontSize: "12px",
        }}
      >
        🔄 Refresh Page
      </button>
    </div>,
    document.body,
  );
};

const PanelPage = () => {
  const [singleGameData, setSingleGameData] = useState({
    openNo: [],
    closeNo: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { id } = useParams();

  const token = localStorage.getItem("authToken");
  let userRole = null;
  let userName = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
      userName = decoded.name || decoded.userName || decoded.username;
    } catch (err) {}
  }

  const canEditResults =
    userRole === "Admin" || userName === singleGameData.owner;

  // Range Modal States
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeDays, setRangeDays] = useState([]);
  const [rangeData, setRangeData] = useState({});
  const [rangeErrors, setRangeErrors] = useState({});
  const [editModal, setEditModal] = useState(null);

  const getDatesBetween = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const list = [];
    let cur = new Date(s);
    while (cur <= e) {
      list.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  };

  useEffect(() => {
    if (rangeStart && rangeEnd) {
      const days = getDatesBetween(rangeStart, rangeEnd);
      setRangeDays(days);
      const obj = {};
      days.forEach((d) => {
        const key = d.toISOString().split("T")[0];

        // Check if data already exists for this date
        const existingOpen = (singleGameData.openNo || []).find(
          (item) => item[2] && String(item[2]).split("T")[0] === key,
        );
        const existingClose = (singleGameData.closeNo || []).find(
          (item) => item[2] && String(item[2]).split("T")[0] === key,
        );

        obj[key] = {
          result: {
            open: existingOpen ? `${existingOpen[0]}-${existingOpen[1]}` : "",
            close: existingClose
              ? `${existingClose[0]}-${existingClose[1]}`
              : "",
          },
          type: existingOpen ? "Open" : existingClose ? "Close" : "Open",
        };
      });
      setRangeData(obj);
    }
  }, [rangeStart, rangeEnd]);

  const digitsOnly = (s = "") => s.toString().replace(/[^0-9]/g, "");

  const computeCheckDigit = (digitsStr) => {
    const arr = digitsStr
      .slice(-3)
      .split("")
      .map((c) => parseInt(c, 10));
    return arr.reduce((a, b) => a + b, 0) % 10;
  };

  const validateRangeEntry = (rawStr) => {
    if (!rawStr) return { ok: false, msg: "Empty value" };
    const parts = rawStr
      .split("-")
      .map((p) => p.trim())
      .filter(Boolean);
    let providedCheck = null;
    if (parts.length >= 2 && /^[0-9]$/.test(parts[parts.length - 1])) {
      providedCheck = parts.pop();
    }
    const mainDigits = digitsOnly(parts.join(""));
    if (!mainDigits) return { ok: false, msg: "Must contain digits" };
    if (mainDigits.length >= 3) {
      const expected = computeCheckDigit(mainDigits);
      if (providedCheck && parseInt(providedCheck) !== expected)
        return { ok: false, msg: `Invalid check digit, expected ${expected}` };
    }
    return { ok: true, mainDigits, providedCheck };
  };

  const formatPanelResult = (panel, digit) =>
    panel && digit ? `${panel}-${digit}` : "";

  const parsePanelResult = (value = "") => {
    const parts = value.split("-").map((part) => part.trim());
    return {
      panel: parts[0] || "",
      digit: parts[1] || "",
    };
  };

  const handleSaveCellResult = async () => {
    try {
      const openResult = parsePanelResult(editModal.openResult);
      const closeResult = parsePanelResult(editModal.closeResult);

      const openPayload = [
        openResult.panel,
        openResult.digit,
        editModal.dateISOString,
        "Open",
        editModal.dayName,
      ];

      const closePayload = [
        closeResult.panel,
        closeResult.digit,
        editModal.dateISOString,
        "Close",
        editModal.dayName,
      ];

      if (openResult.panel && openResult.digit) {
        const openRes = await api(`/AllGames/updateGame/${id}`, {
          method: "PUT",
          body: JSON.stringify({ resultNo: openPayload }),
        });

        if (!openRes.success) {
          throw new Error(openRes.message || "Open result failed");
        }
      }

      if (closeResult.panel && closeResult.digit) {
        const closeRes = await api(`/AllGames/updateGame/${id}`, {
          method: "PUT",
          body: JSON.stringify({ resultNo: closePayload }),
        });

        if (!closeRes.success) {
          throw new Error(closeRes.message || "Close result failed");
        }
      }

      toast.success("Result updated successfully");
      setEditModal(null);
      fetchInitialData();
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const handleSaveRangeResults = async () => {
    if (!rangeDays.length) {
      toast.error("Select a date range");
      return;
    }
    const errors = {};
    const preparedRows = [];

    for (const d of rangeDays) {
      const key = d.toISOString().split("T")[0];
      const entry = rangeData[key] || {
        result: { open: "", close: "" },
        type: "Open",
      };
      const raw =
        entry.type === "Open" ? entry.result.open : entry.result.close;
      const validation = validateRangeEntry((raw || "").trim());
      if (!validation.ok) {
        errors[key] = validation.msg;
        continue;
      }
      const checkDigit =
        validation.providedCheck ?? computeCheckDigit(validation.mainDigits);
      preparedRows.push({
        key,
        date: d,
        mainDigits: validation.mainDigits,
        checkDigit,
        type: entry.type,
        dayName: d.toLocaleDateString("en-US", { weekday: "long" }),
      });
    }

    if (Object.keys(errors).length > 0) {
      setRangeErrors(errors);
      toast.error("Fix validation errors first");
      return;
    }

    setRangeErrors({});
    try {
      for (const r of preparedRows) {
        const payload = [
          r.mainDigits,
          r.checkDigit,
          r.date.toISOString(),
          r.type,
          r.dayName,
        ];
        const res = await api(`/AllGames/updateGameFromPaneel/${id}`, {
          method: "PUT",
          body: JSON.stringify({ resultNo: payload }),
        });
        if (!res.success) throw new Error(res.message || "Failed");
      }
      toast.success("All range results saved!");
      fetchInitialData();
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };
  // Merge new page data into existing accumulated data
  const mergeGameData = (existing, incoming) => {
    return {
      ...incoming,
      openNo: [...(existing.openNo || []), ...(incoming.openNo || [])],
      closeNo: [...(existing.closeNo || []), ...(incoming.closeNo || [])],
    };
  };

  // Initial load: fetch first 365 records (≈ 1 year)
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const data = await api(`/AllGames/${id}?page=1&limit=365`);
      if (data.success) {
        setSingleGameData(data.data || { openNo: [], closeNo: [] });
        setTotalPages(data.totalPages || 1);
        setPage(1);
      } else {
        setError("Failed to fetch game data.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load more: fetch next page and append
  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await api(`/AllGames/${id}?page=${nextPage}&limit=365`);
      if (data.success) {
        setSingleGameData((prev) => mergeGameData(prev, data.data || {}));
        setTotalPages(data.totalPages || 1);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Load more failed:", err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (id) fetchInitialData();
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          fontSize: "18px",
          color: "#c0392b",
        }}
      >
        Loading game data...
      </div>
    );
  if (error) return <div>Error: {error}</div>;

  // ------------------------
  //  Group by DATE (YYYY-MM-DD)
  // ------------------------
  const groupedByDate = {};

  (singleGameData.openNo || []).forEach((item) => {
    if (!Array.isArray(item) || item.length < 3) return;
    const dateKey = String(item[2]).split("T")[0];
    groupedByDate[dateKey] = groupedByDate[dateKey] || {};
    groupedByDate[dateKey].open = item;
    groupedByDate[dateKey].day = item[4] || groupedByDate[dateKey].day;
  });

  (singleGameData.closeNo || []).forEach((item) => {
    if (!Array.isArray(item) || item.length < 3) return;
    const dateKey = String(item[2]).split("T")[0];
    groupedByDate[dateKey] = groupedByDate[dateKey] || {};
    groupedByDate[dateKey].close = item;
    groupedByDate[dateKey].day = item[4] || groupedByDate[dateKey].day;
  });

  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const groupedByDay = {};
  const groupedByDayOpen = {};
  dayNames.forEach((d) => {
    groupedByDay[d] = [];
    groupedByDayOpen[d] = [];
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  sortedDateKeys.forEach((dateKey) => {
    const item = groupedByDate[dateKey];
    const day =
      item.day ||
      new Date(dateKey).toLocaleDateString("en-US", { weekday: "long" });
    const open = item.open || ["", "", dateKey, "Open", day];
    const close = item.close || ["", "", dateKey, "Close", day];

    if (!groupedByDayOpen[day]) groupedByDayOpen[day] = [];
    if (!groupedByDay[day]) groupedByDay[day] = [];

    groupedByDayOpen[day].push(open);
    groupedByDay[day].push(close);
  });

  const baseDateFromData =
    sortedDateKeys.length > 0
      ? sortedDateKeys[0]
      : new Date().toISOString().split("T")[0];

  const description = `Dpboss ${singleGameData.name} jodi chart, ${singleGameData.name} jodi chart, old ${singleGameData.name} jodi chart, dpboss ${singleGameData.name} chart, ${singleGameData.name} jodi record, ${singleGameData.name}jodi record, ${singleGameData.name} jodi chart 2015, ${singleGameData.name} jodi chart 2012, ${singleGameData.name} jodi chart 2012 to 2023, ${singleGameData.name} final ank, ${singleGameData.name} jodi chart.co, ${singleGameData.name} jodi chart matka, matka jodi chart ${singleGameData.name}, matka ${singleGameData.name} chart, satta ${singleGameData.name} chart jodi, ${singleGameData.name} state chart, ${singleGameData.name} chart result`;

  const toLocalDateKey = (date = new Date()) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayDateKey = toLocalDateKey();
  const todayCompleteResult = groupedByDate[todayDateKey];
  const latestCompleteResult = sortedDateKeys
    .slice()
    .reverse()
    .map((dateKey) => groupedByDate[dateKey])
    .find((entry) => entry?.open && entry?.close);
  const displayResult = todayCompleteResult || latestCompleteResult;

  const todayResult =
    displayResult?.open && displayResult?.close
      ? `${displayResult.open[0]}-${displayResult.open[1]}${displayResult.close[1]}-${displayResult.close[0]}`
      : displayResult?.open
        ? `${displayResult.open[0]}-${displayResult.open[1]}`
        : displayResult?.close
          ? `${displayResult.close[0]}-${displayResult.close[1]}`
          : "N/A";

  return (
    <div className="bg-danger border m-1 border-danger text-center">
      <Header />
      <StaticButtons />
      {/* Add Range Button — Admin/Agent only */}
      {(userRole === "Admin" || userRole === "Agent") && (
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <button
            className="btn btn-dark m-1"
            onClick={() => setShowRangeModal(true)}
          >
            ADD RANGE RESULT
          </button>
        </div>
      )}

      {/* Range Modal */}
      {showRangeModal && (
        <div className="AddGameModelMainContainer">
          <div className="AddGameModelSeconContainer">
            <h3>Add Range Results</h3>

            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
            />

            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
            />

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginTop: "10px",
              }}
            >
              {rangeDays.map((d) => {
                const key = d.toISOString().split("T")[0];
                const row = rangeData[key] || {
                  result: { open: "", close: "" },
                  type: "Open",
                };
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ minWidth: 200, fontSize: "13px" }}>
                      {key} (
                      {d.toLocaleDateString("en-US", { weekday: "long" })})
                    </div>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="111-3"
                      value={
                        row.type === "Open" ? row.result.open : row.result.close
                      }
                      onChange={(e) =>
                        setRangeData({
                          ...rangeData,
                          [key]: {
                            ...row,
                            result: {
                              ...row.result,
                              [row.type === "Open" ? "open" : "close"]:
                                e.target.value,
                            },
                          },
                        })
                      }
                    />
                    <select
                      value={row.type}
                      onChange={(e) =>
                        setRangeData({
                          ...rangeData,
                          [key]: { ...row, type: e.target.value },
                        })
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="Close">Close</option>
                    </select>
                    {rangeErrors[key] && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {rangeErrors[key]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <button
                className="btn btn-success"
                onClick={handleSaveRangeResults}
              >
                Save All
              </button>
              <button
                className="btn btn-secondary ms-2"
                onClick={() => setShowRangeModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "Pink" }}
      >
        <h3>{singleGameData.name} JODI CHART</h3>
      </div>

      <div className="bg-warning m-1 border border-white py-3 text-center">
        <p>{description}</p>
      </div>

      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "Pink" }}
      >
        <h3>{singleGameData.name}</h3>
        <h3>{todayResult}</h3>
      </div>

      {/* <PanelMatkaTable
        groupedData={groupedByDay}
        groupedByDayOpen={groupedByDayOpen}
        gameName={singleGameData.name}
        baseDateFromData={baseDateFromData}
        noOfDays={singleGameData.noOfDays}
      /> */}
      <PanelMatkaTable
        groupedData={groupedByDay}
        groupedByDayOpen={groupedByDayOpen}
        gameName={singleGameData.name}
        baseDateFromData={baseDateFromData}
        noOfDays={singleGameData.noOfDays}
        canEditResults={canEditResults}
        onEditResult={(cell) =>
          setEditModal({
            ...cell,
            openResult: formatPanelResult(cell.openPanel, cell.openDigit),
            closeResult: formatPanelResult(cell.closePanel, cell.closeDigit),
          })
        }
      />

      {/* Load More Button */}
      {page < totalPages && (
        <div style={{ margin: "20px auto", textAlign: "center" }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              backgroundColor: loadingMore ? "#aaa" : "#c0392b",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "12px 36px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loadingMore ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
              transition: "background 0.2s",
            }}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "Pink" }}
      >
        <h3>{singleGameData.name}</h3>
        <h3>{todayResult}</h3>
      </div>
      {editModal && (
        <div className="AddGameModelMainContainer">
          <div className="AddGameModelSeconContainer">
            <h3>Edit Result</h3>

            <p>
              {editModal.dateKey} ({editModal.dayName})
            </p>

            <div>
              <label>Open Result</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 123-6"
                value={editModal.openResult || ""}
                onChange={(e) =>
                  setEditModal({ ...editModal, openResult: e.target.value })
                }
              />
            </div>

            <div>
              <label>Close Result</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 890-7"
                value={editModal.closeResult || ""}
                onChange={(e) =>
                  setEditModal({ ...editModal, closeResult: e.target.value })
                }
              />
            </div>

            <div className="mt-3">
              <button
                className="btn btn-success"
                onClick={handleSaveCellResult}
              >
                Save
              </button>

              <button
                className="btn btn-secondary ms-2"
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <JodiPannelNotification/>
    </div>
  );
};

export default PanelPage;
