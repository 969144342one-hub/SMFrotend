// src/pages/JodiPanPage.jsx
import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import MatkaTable from "../components/JodiMatkaTable";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";

const JodiPanPage = () => {
  const [singleGameData, setSingleGameData] = useState({
    openNo: [],
    closeNo: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("authToken");
  let userRole = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.role;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  const { id } = useParams();

  const [showRangeModal, setShowRangeModal] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeDays, setRangeDays] = useState([]);
  const [rangeData, setRangeData] = useState({});
  const [rangeErrors, setRangeErrors] = useState({});

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
        const res = await api(`/AllGames/updateGame/${id}`, {
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

  // Initial load: fetch first 365 records
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
      const data = await api(`/AllGames/${id}?page=${nextPage}&limit=180`);
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
          color: "#fff",
        }}
      >
        Loading game data...
      </div>
    );

  if (error) return <div>Error: {error}</div>;

  // ------------------------------------------------------------------
  // EXCEL + JSON FILE UPLOAD HANDLER
  // ------------------------------------------------------------------
  const handleFileUpload = async () => {
    try {
      if (!jsonFile) {
        toast.warn("Please select a file first!");
        return;
      }

      const fileName = jsonFile.name.toLowerCase();
      let jsonData = null;

      if (fileName.endsWith(".json")) {
        const fileText = await jsonFile.text();
        jsonData = JSON.parse(fileText);
      } else if (fileName.endsWith(".xlsx")) {
        const data = await jsonFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        toast.error("Only .json or .xlsx files are allowed!");
        return;
      }

      const response = await api("/AllGames/updateGamesData", {
        method: "POST",
        body: JSON.stringify(jsonData),
      });

      if (response.success) {
        toast.success("Game data updated successfully!");
        fetchInitialData();
      } else {
        toast.error(response.message || "Failed to update game data!");
      }
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      toast.error("Error updating game data");
    }
  };

  // ------------------------------------------------------------------
  // Build groupedByDay and groupedByDay_Open
  // ------------------------------------------------------------------
  const getDateKeyFromItem = (item) => {
    if (!item) return null;
    const dateRaw = item[2];
    if (dateRaw) return String(dateRaw).split("T")[0];
    for (let i = 0; i < item.length; i++) {
      if (typeof item[i] === "string" && /\d{4}-\d{2}-\d{2}/.test(item[i])) {
        return item[i].split("T")[0];
      }
    }
    return null;
  };

  const dateMap = {};

  (singleGameData.openNo || []).forEach((item) => {
    const dateKey = getDateKeyFromItem(item);
    if (!dateKey) return;
    const dObj = dateMap[dateKey] || {};
    dObj.day = new Date(dateKey).toLocaleDateString("en-US", {
      weekday: "long",
    });
    dObj.open = item;
    dateMap[dateKey] = dObj;
  });

  (singleGameData.closeNo || []).forEach((item) => {
    const dateKey = getDateKeyFromItem(item);
    if (!dateKey) return;
    const dObj = dateMap[dateKey] || {};
    dObj.day = new Date(dateKey).toLocaleDateString("en-US", {
      weekday: "long",
    });
    dObj.close = item;
    dateMap[dateKey] = dObj;
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
  const groupedByDay_Open = {};
  dayNames.forEach((d) => {
    groupedByDay[d] = [];
    groupedByDay_Open[d] = [];
  });

  const sortedDates = Object.keys(dateMap).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  sortedDates.forEach((dateKey) => {
    const entry = dateMap[dateKey];
    const day =
      entry.day ||
      new Date(dateKey).toLocaleDateString("en-US", { weekday: "long" });
    if (entry.open) groupedByDay_Open[day].push(entry.open);
    if (entry.close) groupedByDay[day].push(entry.close);
  });

  const todayResult =
    singleGameData.openNo?.length > 0 && singleGameData.closeNo?.length > 0
      ? `${singleGameData.openNo[0][0]}-${singleGameData.openNo[0][1]}${singleGameData.closeNo[0][1]}-${singleGameData.closeNo[0][0]}`
      : "N/A";

  return (
    <div
      className="border m-1 border-danger text-center"
      style={{ backgroundColor: "black" }}
    >
      <Header />

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

      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "white" }}
      >
        <h3>JODI CHART</h3>
      </div>

      {/* File Upload — Admin only */}
      {userRole === "Admin" && (
        <div
          className="bg-light border border-dark p-3 m-2"
          style={{ borderRadius: "10px" }}
        >
          <h5>Import / Update Game Data (.json or .xlsx)</h5>
          <input
            type="file"
            accept=".json, .xlsx"
            onChange={(e) => setJsonFile(e.target.files[0])}
            className="form-control my-2"
          />
          <button
            onClick={handleFileUpload}
            className="btn btn-success"
            disabled={!jsonFile}
          >
            Upload & Update
          </button>
        </div>
      )}

      {/* TOP Result */}
      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "white" }}
      >
        <h3>{singleGameData.name}</h3>
        <h3>{todayResult}</h3>
      </div>

      {/* TABLE */}
      <MatkaTable
        groupedData={groupedByDay}
        groupedDataOpen={groupedByDay_Open}
        titleNameHeading={singleGameData.name}
        noOfDays={singleGameData.noOfDays}
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

      {/* BOTTOM Result */}
      <div
        className="border m-1 border-danger text-center"
        style={{ backgroundColor: "white" }}
      >
        <h3>{singleGameData.name}</h3>
        <h3>{todayResult}</h3>
      </div>
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
      <ToastContainer />
    </div>
  );
};

export default JodiPanPage;
