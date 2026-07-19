import React, { useEffect, useState } from "react";
import LiveResultItem from "./LiveResultItem";
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LiveResultSection = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("authToken");

  const [editGame, setEditGame] = useState({
    id: "",
    resultNo: "",
    openOrClose: "",
    day: "",
    date: "",
    todayOpenResult: "",
    todayCloseResult: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [nameForPop, setNameForPop] = useState("");

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

  function isOlderThan12Hours(dateString) {
    const updated = new Date(dateString);
    const now = new Date();
    const diffMs = now - updated;
    const hours = diffMs / (1000 * 60 * 60);
    return hours >= 24;
  }

  const WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  function isGameAllowedToday(noOfDays) {
    if (!noOfDays || noOfDays < 1) return false;

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const allowedDays = WEEK_DAYS.slice(0, noOfDays - 1);

    return allowedDays.includes(today);
  }

  function isSameLocalDate(dateString, dateToCompare = new Date()) {
    if (!dateString) return false;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    return (
      date.getFullYear() === dateToCompare.getFullYear() &&
      date.getMonth() === dateToCompare.getMonth() &&
      date.getDate() === dateToCompare.getDate()
    );
  }

  function hasTodayOpenAndClose(game) {
    return hasTodayResult(game.openNo) && hasTodayResult(game.closeNo);
  }

  function hasTodayResult(list) {
    return Array.isArray(list) && list.some((entry) => isSameLocalDate(entry?.[2]));
  }

  function getLatestEntry(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;

    return [...arr].sort((a, b) => new Date(b[2]) - new Date(a[2]))[0];
  }

  function hasCompleteLatestNonTodayResult(game) {
    const lastOpen = getLatestEntry(game.openNo);
    const lastClose = getLatestEntry(game.closeNo);

    if (!lastOpen?.[2] || !lastClose?.[2]) return false;

    const openDateKey = String(lastOpen[2]).split("T")[0];
    const closeDateKey = String(lastClose[2]).split("T")[0];

    return (
      openDateKey === closeDateKey &&
      !isSameLocalDate(lastOpen[2]) &&
      !isSameLocalDate(lastClose[2])
    );
  }

  function timeToTodayDate(timeStr) {
    if (!timeStr) return null;

    const now = new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
    );
  }

  function isInResultLoadingWindow(timeStr, now = new Date()) {
    const resultTime = timeToTodayDate(timeStr);
    if (!resultTime || isNaN(resultTime.getTime())) return false;

    const tenMinutes = 10 * 60 * 1000;
    const windowStart = new Date(resultTime.getTime() - tenMinutes);
    const windowEnd = new Date(resultTime.getTime() + tenMinutes);

    return now >= windowStart && now <= windowEnd;
  }

  function getLiveSort(game) {
    const now = new Date();
    const openTime = timeToTodayDate(game.startTime || game.openTime);
    const closeTime = timeToTodayDate(game.endTime || game.closeTime);

    let targetTime = openTime;
    if (hasTodayResult(game.openNo) && !hasTodayResult(game.closeNo)) {
      targetTime = closeTime;
    }

    if (!targetTime || isNaN(targetTime.getTime())) {
      return { group: 2, value: Infinity };
    }

    const diff = targetTime - now;
    if (diff >= 0) {
      return { group: 0, value: diff };
    }

    return { group: 1, value: Math.abs(diff) };
  }

  const handleEditClick = (game) => {
    const todayDate = new Date();
    const dayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });
    const getTodayResultInput = (list = []) => {
      const entry = list.find((item) => isSameLocalDate(item?.[2], todayDate));
      return entry ? `${entry[0] || ""}-${entry[1] || ""}` : "";
    };

    setEditGame({
      id: game.id,
      resultNo: "",
      openOrClose: "",
      day: dayName,
      date: todayDate,
      todayOpenResult: getTodayResultInput(game.openNo),
      todayCloseResult: getTodayResultInput(game.closeNo),
    });

    setNameForPop(game.title);
    setShowEditModal(true);
  };

  const handleUpdateGame = async (e) => {
    e.preventDefault();

    const gameId = editGame.id;
    const inputValue = editGame.resultNo || "";
    const parts = inputValue.split("-").map((num) => num.trim());

    if (
      inputValue.length === 5 &&
      parts[0].length !== 3 &&
      !inputValue.includes("-")
    ) {
      toast.error("Invalid format. Please enter a number like 123-7.");
      return;
    }

    if (parts.length === 0 || !/^\d+$/.test(parts[0])) {
      toast.error("Invalid format. Please enter a number like 123-7.");
      return;
    }

    const mainNumber = parts[0];
    const providedCheckDigit = parts[1];

    if (mainNumber.length >= 3) {
      const d1 = parseInt(mainNumber[0], 10);
      const d2 = parseInt(mainNumber[1], 10);
      const d3 = parseInt(mainNumber[2], 10);

      const firstDigit = d1 === 0 ? 10 : d1;
      const secondDigit = d2 === 0 ? 10 : d2;
      const thirdDigit = d3 === 0 ? 10 : d3;

      if (!(firstDigit <= secondDigit && secondDigit <= thirdDigit)) {
        toast.error(
          "Invalid number Please check or contact operator : First < Second < Third",
        );
        return;
      }

      const lastThree = mainNumber.slice(-3).split("").map(Number);
      const sum = lastThree.reduce((a, b) => a + b, 0);
      const expectedCheckDigit = sum % 10;

      if (
        providedCheckDigit &&
        parseInt(providedCheckDigit, 10) !== expectedCheckDigit
      ) {
        toast.error(
          `Invalid number: check digit should be ${expectedCheckDigit} (sum of last 3 digits).`,
        );
        return;
      }
    }

    const newResultArray = [mainNumber];

    if (providedCheckDigit) newResultArray.push(providedCheckDigit);

    if (editGame.openOrClose) {
      newResultArray.push(editGame.date, editGame.openOrClose, editGame.day);
    }

    try {
      const updateData = await api(`/AllGames/updateGame/${gameId}`, {
        method: "PUT",
        body: JSON.stringify({ resultNo: newResultArray }),
      });

      if (updateData.success) {
        toast.success("Game Number updated successfully!");
        setShowEditModal(false);

        // refresh live data
        setLoading(true);
        window.location.reload();
      } else {
        toast.error("Failed to update game: " + updateData.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating game");
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await api("/AllGames/latest-updates");

        if (data && data.hasData && Array.isArray(data.data)) {
          // 🔹 1) Filter only ACTIVE games
          const activeGames = data.data.filter((game) => {
            // If backend sends isActive flag
            if (typeof game.isActive === "boolean") {
              return game.isActive === true;
            }

            // If backend sends status field
            if (typeof game.status === "string") {
              return game.status.toUpperCase() !== "INACTIVE";
            }

            if (!isGameAllowedToday(game.noOfDays)) return false;
            // If no flag, treat as active by default
            return true;
          });

          // 🔹 2) Then format only active games
          const formatted = activeGames.map((game) => {
            const now = new Date();

            const openTimeFromGame = game.startTime || "";
            const closeTimeFromGame = game.endTime || "";
            const latestOpen = getLatestEntry(game.openNo);
            const latestClose = getLatestEntry(game.closeNo);
            const openDate = new Date(latestOpen?.[2]);
            const closeDate = new Date(latestClose?.[2]);
            const lastUpdate = openDate > closeDate ? openDate : closeDate;

            const shouldShowOpenLoading =
              isInResultLoadingWindow(game.startTime, now) &&
              !hasTodayResult(game.openNo);
            const shouldShowCloseLoading =
              isInResultLoadingWindow(game.endTime, now) &&
              !hasTodayResult(game.closeNo);

            if (
              (shouldShowOpenLoading || shouldShowCloseLoading) &&
              !hasCompleteLatestNonTodayResult(game)
            ) {
              return {
                id: game._id,
                title: game.name,
                owner: game.owner,
                status: game.status,
                validDate: game.valid_date,
                numbers: "Loading...",
                openTime: openTimeFromGame,
                closeTime: closeTimeFromGame,
                updatedAt: lastUpdate,
                hasTodayOpenAndClose: hasTodayOpenAndClose(game),
                openNo: game.openNo || [],
                closeNo: game.closeNo || [],
              };
            }

            const lastOpen = latestOpen;
            const lastClose = latestClose;

            // if (!lastOpen && !lastClose) {
            //   return {
            //     title: game.name,
            //     numbers: "***_**_***",
            //     openTime: openTimeFromGame,
            //     closeTime: closeTimeFromGame,
            //     updatedAt: lastUpdate,
            //   };
            // }

            const openMain = lastOpen?.[0] || "";
            const openDigit = lastOpen?.[1] || "";
            const openDay = lastOpen?.[4] || "";

            const closeMain = lastClose?.[0] || "";
            const closeDigit = lastClose?.[1] || "";
            const closeDay = lastClose?.[4] || "";

            let lastResult = `${openMain}-${openDigit}${closeDigit}-${closeMain}`;

            if (
              lastOpen &&
              lastClose &&
              openDay === closeDay &&
              lastOpen[2].split("T")[0] === lastClose[2].split("T")[0]
            ) {
              lastResult = `${openMain}-${openDigit}${closeDigit}-${closeMain}`;
            } else if (
              lastOpen &&
              (!lastClose || new Date(lastOpen[2]) > new Date(lastClose[2]))
            ) {
              lastResult = `${openMain}-${openDigit}`;
            } else if (
              lastClose &&
              (!lastOpen || new Date(lastClose[2]) > new Date(lastOpen[2]))
            ) {
              lastResult = `${closeMain}-${closeDigit}`;
            }

            return {
              id: game._id,
              title: game.name,
              owner: game.owner,
              status: game.status,
              validDate: game.valid_date,
              numbers: lastResult,
              openTime: openTimeFromGame,
              closeTime: closeTimeFromGame,
              updatedAt: lastUpdate,
              hasTodayOpenAndClose: hasTodayOpenAndClose(game),
              openNo: game.openNo || [],
              closeNo: game.closeNo || [],
            };
          });

          setResults(
            formatted.sort((a, b) => {
              const sortA = getLiveSort(a);
              const sortB = getLiveSort(b);

              if (sortA.group !== sortB.group) return sortA.group - sortB.group;
              return sortA.value - sortB.value;
            }),
          );
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error fetching live results:", err);
        setError("Failed to fetch live results. Please try again later.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);
  // console.log(results);

  if (loading) {
    return (
      <div className="bg-warning border border-white Live-Result-section-main-container bg-[#ffea00]">
        <div className="bg-pink text-white text-center  mb-4 fw-bold Live-Result-Heading">
          <h2>💥LIVE RESULT💥</h2>
        </div>
        <p className="text-center">Loading results...</p>
      </div>
    );
  }

  return (
    <div
      className="border border-white m-1 p-1 Live-Result-section-main-container"
      style={{ backgroundColor: "#c9f3f6" }}
    >
      <div
        className="text-white text-center py-1 mb-1 fw-bold Live-Result-Heading"
        style={{ backgroundColor: "#ff00a1" }}
      >
        <h3 style={{ fontSize: "1.2rem", margin: 0 }}>💥LIVE RESULT💥</h3>
      </div>

      <div className="" style={{ width: "100%", margin: "0px" }}>
        {error ? (
          <p
            className="text-center text-danger"
            style={{ backgroundColor: "black" }}
          >
            {error}
          </p>
        ) : results.length > 0 ? (
          results.map((item, idx) => (
            <div
              className="col-md-4 mb-0 d-flex justify-content-center"
              key={idx}
              style={{ width: "100%" }}
            >
              <LiveResultItem
                title={item.title}
                numbers={item.numbers}
                openTime={item.openTime}
                closeTime={item.closeTime}
              />
              
              <button
                className="btn btn-primary btn-sm mt-1"
                onClick={() => handleEditClick(item)}
                hidden={
                  !(
                    role === "Admin" ||
                    (role === "Agent" && item.owner === username)
                  )
                }
                disabled={
                  item.hasTodayOpenAndClose ||
                  (item.validDate
                    ? new Date(item.validDate).getTime() < Date.now()
                    : false)
                }
              >
                EDIT
              </button>
            </div>
          ))
        ) : (
          <p className="text-center">No live results found.</p>
        )}
      </div>
      {showEditModal && (
        <div className="AddGameModelMainContainer overflow-auto">
          <div className="AddGameModelSeconContainer">
            <h2>{nameForPop}</h2>

            <form onSubmit={handleUpdateGame}>
              <div className="form-group">
                <label htmlFor="openOrClose">Action</label>
                <select
                  id="openOrClose"
                  value={editGame.openOrClose}
                  onChange={(e) => {
                    const openOrClose = e.target.value;
                    setEditGame({
                      ...editGame,
                      openOrClose,
                      resultNo:
                        openOrClose === "Open"
                          ? editGame.todayOpenResult
                          : openOrClose === "Close"
                            ? editGame.todayCloseResult
                            : "",
                    });
                  }}
                  required
                >
                  <option value="">Select Action</option>
                  <option value="Open">Open</option>
                  <option value="Close">Close</option>
                </select>
              </div>

              <div>
                <label>Result No</label>
                <input
                  type="text"
                  placeholder="e.g. 111-3"
                  value={editGame.resultNo}
                  onChange={(e) =>
                    setEditGame({ ...editGame, resultNo: e.target.value })
                  }
                />
              </div>

              <div className="button-group mt-3">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>

                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default LiveResultSection;
