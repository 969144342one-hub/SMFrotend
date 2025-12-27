import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { Alert } from "bootstrap";

export default function SimpleEndpointUI() {
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(false); // This controls the color
  const [games, setGames] = useState([]);
  const [avialbeUrl, setAvialbeUrl] = useState(null);
  const [selectedGames, setSelectedGames] = useState([]);
  const [filterGames, setFilterGames] = useState([]);
  const [userSelectGames, setUserSelectGames] = useState([]);
  const [gamesForCalling, setGamesForCalling] = useState([]);

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

  // Fetch all data
  const initializeData = async () => {
    try {
      const allGamesRes = await api("/AllGames/", { method: "GET" });
      const masterGames = allGamesRes.data;

      setGames(masterGames);

      const recordRes = await api("/AllGames/getGamesAndUrl");
      if (recordRes.data && recordRes.data.length > 0) {
        const record = recordRes.data[0];

        setAvialbeUrl(record);
        setUserSelectGames(record.ArrayOfGames || []);
        setUrl(record.url || "");
        setIsActive(record.enabled || false); // Set initial color state from DB

        const savedIdSet = new Set(
          (record.ArrayOfGames || []).map((id) => String(id))
        );
        setFilterGames(
          masterGames.filter((g) => !savedIdSet.has(String(g._id)))
        );

        const callingList = [];
        masterGames.forEach((e) => {
          if (recordRes.data[0]?.ArrayOfGames.includes(e._id)) {
            callingList.push(e); // Push to calling list
          }
        });

        setGamesForCalling(callingList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // const getTheUrlGameDetils = async () => {
  //   const fetchData = await api("/AllGames/getGamesAndUrl");
  //   const savedIds = fetchData.data[0]?.ArrayOfGames || [];

  //   const callingList = []; // Temp array for "pushed" items
  //   const filterList = [];

  //   games.forEach((e) => {
  //     if (fetchData.data[0]?.ArrayOfGames.includes(e._id)) {
  //       callingList.push(e); // Push to calling list
  //     }
  //   });

  //   // Save to state so the scheduler can see them
  //   setGamesForCalling(callingList);
  //   console.log(callingList);

  //   setFilterGames(filterList);
  //   setUserSelectGames(savedIds);
  //   setAvialbeUrl(fetchData.data[0]);
  // };

  useEffect(() => {
    // This function checks the time for all active games
    const checkGameWindows = () => {
      const now = new Date().getTime(); // Current time in milliseconds
      const FIVE_MIN = 5 * 60 * 1000;
      const TEN_MIN = 10 * 60 * 1000;

      console.log("Checking game windows at:", new Date().toLocaleTimeString());

      gamesForCalling.forEach((game) => {
        // Assuming game.startTime and game.closeTime are valid Date strings or timestamps
        const start = new Date(game.startTime).getTime();

        const close = new Date(game.closeTime).getTime();

        // Define Windows
        const isWithinStartWindow =
          now >= start - FIVE_MIN && now <= start + TEN_MIN;

        const isWithinCloseWindow =
          now >= close - FIVE_MIN && now <= close + TEN_MIN;

        if (isWithinStartWindow) {
          console.log(`[START WINDOW] Calling API for: ${game.name}`);
          triggerGameAPI(game, "start");
        }

        if (isWithinCloseWindow) {
          console.log(`[CLOSE WINDOW] Calling API for: ${game.name}`);
          triggerGameAPI(game, "close");
        }
      });
    };

    // Run the check every 30 seconds
    const interval = setInterval(checkGameWindows, 30000);

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, [gamesForCalling]); // Runs again if the list of games changes

  useEffect(() => {
    // Helper: convert "HH:mm" string into total minutes since midnight
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    // Only run if the system is active and we have games to call
    if (!isActive || gamesForCalling.length === 0) return;

    const scheduler = setInterval(() => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes

      gamesForCalling.forEach((game) => {
        const gameStartMins = parseTimeToMinutes(game.startTime);
        const gameCloseMins = parseTimeToMinutes(game.endTime);

        if (gameStartMins === null || gameCloseMins === null) {
          console.warn(`Invalid time format for game ${game.name}`);
          return;
        }

        // Define Windows (5 mins before to 10 mins after)
        const inStartWindow =
          currentTime >= gameStartMins - 5 && currentTime <= gameStartMins + 10;
        const inCloseWindow =
          currentTime >= gameCloseMins - 5 && currentTime <= gameCloseMins + 10;

        // Trigger API if inside window
        if (inStartWindow) {
          console.log(`Triggering START API for ${game.name}`);
          callExternalAPI(game, "START");
        }
        if (inCloseWindow) {
          console.log(`Triggering CLOSE API for ${game.name}`);
          callExternalAPI(game, "CLOSE");
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(scheduler); // Cleanup when component unmounts
  }, [isActive, gamesForCalling]);

  const callExternalAPI = async (game, type) => {
    // This is the API you want to call every 5-10 mins
    console.log(`Calling API for ${game.name} - Type: ${type}`);
    try {
      const response = await api("/AllGames/api/getGameFormLink", {
        method: "POST",
        body: JSON.stringify({
          url: avialbeUrl.url,
          userName: username,
          admin: role,
        }),
      });
      // if (response.success) {
      //   alert("Games updated successfully!");

      // } else {
      //   alert("Failed: " + response.error);
      // }
    } catch (err) {
      console.error("Error updating from link:", err);
    }
    // await api("/your-endpoint", { method: "POST", body: { id: game._id, type } });
  };

  // The actual API call function
  const triggerGameAPI = async (game, type) => {
    try {
      // Replace with your actual endpoint logic
      await api("/execute-game-action", {
        method: "POST",
        body: JSON.stringify({
          gameId: game._id,
          type: type, // "start" or "close"
          timestamp: new Date(),
        }),
      });
    } catch (err) {
      console.error(`Failed to call API for ${game.name}:`, err);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // 1. Toggle color and state locally
  const handleStatusToggle = () => {
    setIsActive(!isActive);
  };

  const addItem = async () => {
    const BodyData = {
      url: url,
      ArrayOfGames: selectedGames,
      enabled: isActive, // Sends the current Start/Stop state
    };

    await api("/AllGames/endpoints", {
      method: "POST",
      body: JSON.stringify(BodyData),
    });

    alert("Configuration Saved!");
    initializeData();
    setSelectedGames([]);
  };

  return (
    <div
      style={{
        ...styles.containerApicaller,
        borderTop: `10px solid ${isActive ? "#2ecc71" : "#e74c3c"}`, // Visual indicator on top border
      }}
    >
      <h3 style={{ color: isActive ? "#27ae60" : "#c0392b" }}>
        System Status: {isActive ? "ACTIVE" : "INACTIVE"}
      </h3>

      <div style={styles.statusSection}>
        <p>
          Current Link: <strong>{avialbeUrl?.url}</strong>
        </p>
        <h4>Games already in this Record:</h4>
        <ul>
          {userSelectGames.map((gameId) => {
            const gameObj = games.find((g) => String(g._id) === String(gameId));
            return (
              <li key={gameId}>{gameObj ? gameObj.name : "Loading..."}</li>
            );
          })}
        </ul>
        {/* The Toggle Button with Dynamic Colors */}
        <button
          onClick={handleStatusToggle}
          style={{
            ...styles.toggleBtn,
            backgroundColor: isActive ? "#e74c3c" : "#2ecc71", // Green if stopped, Red if started
          }}
        >
          {isActive ? "CLICK TO STOP" : "CLICK TO START"}
        </button>
      </div>

      <hr />

      <h4>Select Games to Add</h4>
      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ fontWeight: "bold", display: "block", marginBottom: "6px" }}
        >
          API / Game Form URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL here"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <select
        multiple
        value={selectedGames}
        onChange={(e) =>
          setSelectedGames(
            Array.from(e.target.selectedOptions, (opt) => opt.value)
          )
        }
        style={styles.multiSelect}
      >
        {filterGames.map((game) => (
          <option key={game._id} value={game._id}>
            {game.name}
          </option>
        ))}
      </select>

      <button onClick={addItem} style={styles.saveBtn}>
        Save & Update Record
      </button>
    </div>
  );
}

const styles = {
  containerApicaller: {
    // maxWidth: "500px",
    // margin: "20px auto",
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif",
  },
  statusSection: {
    padding: "15px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    marginBottom: "20px",
    textAlign: "center",
  },
  toggleBtn: {
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "25px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.3s",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#34495e",
    color: "white",
    border: "none",
    borderRadius: "6px",
    marginTop: "20px",
    cursor: "pointer",
  },
  multiSelect: {
    width: "100%",
    height: "120px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ddd",
  },
};
