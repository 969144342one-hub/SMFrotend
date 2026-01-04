import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";

export default function SimpleEndpointUI() {
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [games, setGames] = useState([]);
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedGames, setSelectedGames] = useState([]);
  const [existingGames, setExistingGames] = useState([]);
  const [record, setRecord] = useState(null);

  const token = localStorage.getItem("authToken");
  let username = null;
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      username = decoded.username;
      role = decoded.role;
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  // 🔹 Load data ONLY for UI
  const initializeData = async () => {
    try {
      const allGamesRes = await api("/AllGames/");
      const masterGames = allGamesRes.data;
      setGames(masterGames);

      const recordRes = await api("/AllGames/getGamesAndUrl");
      if (recordRes.data?.length) {
        const rec = recordRes.data[0];
        setRecord(rec);
        setUrl(rec.url || "");
        setIsActive(rec.enabled || false);
        setExistingGames(rec.ArrayOfGames || []);

        const existingSet = new Set(rec.ArrayOfGames.map(String));
        setAvailableGames(
          masterGames.filter((g) => !existingSet.has(String(g._id)))
        );
      } else {
        setAvailableGames(masterGames);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    initializeData();
  }, []);

  // 🔹 Toggle Start / Stop (NO API)
  const handleStatusToggle = () => {
    setIsActive((prev) => !prev);
  };

  // 🔹 Add selected games
  const handleAddGames = () => {
    const combined = [...existingGames, ...selectedGames];
    setExistingGames(combined);

    const removeSet = new Set(selectedGames.map(String));
    setAvailableGames((prev) =>
      prev.filter((g) => !removeSet.has(String(g._id)))
    );

    setSelectedGames([]);
  };

  // 🔹 REMOVE game feature ✅
  const handleRemoveGame = async (gameId) => {
    try {
      await api("/AllGames/remove-game", {
        method: "PUT",
        body: JSON.stringify({ gameId }),
      });

      alert("Game removed permanently");

      // Reload fresh data from DB
      initializeData();
    } catch (err) {
      console.error("Remove failed", err);
      alert("Failed to remove game");
    }1
  };

  // 🔹 SAVE – ONLY API CALL
  const handleSave = async () => {
    try {
      await api("/AllGames/endpoints", {
        method: "POST",
        body: JSON.stringify({
          url,
          ArrayOfGames: existingGames,
          enabled: isActive,
          userName: username,
          admin: role,
        }),
      });

      alert("Configuration saved successfully!");
      initializeData();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  return (
    <div
      style={{
        ...styles.container,
        borderTop: `8px solid ${isActive ? "#2ecc71" : "#e74c3c"}`,
      }}
    >
      <h3 style={{ color: isActive ? "#27ae60" : "#c0392b" }}>
        System Status: {isActive ? "ACTIVE" : "INACTIVE"}
      </h3>

      <button
        onClick={handleStatusToggle}
        style={{
          ...styles.toggleBtn,
          backgroundColor: isActive ? "#e74c3c" : "#2ecc71",
        }}
      >
        {isActive ? "STOP SYSTEM" : "START SYSTEM"}
      </button>

      <hr />

      {/* URL INPUT */}
      <label style={styles.label}>API / Game URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
        style={styles.input}
      />

      <hr />

      {/* EXISTING GAMES */}
      <h4>Selected Games</h4>
      {existingGames.length === 0 && <p>No games selected</p>}
      <ul>
        {existingGames.map((id) => {
          const game = games.find((g) => String(g._id) === String(id));
          return (
            <li key={id} style={styles.gameItem}>
              {game?.name}
              <button
                onClick={() => handleRemoveGame(id)}
                style={styles.removeBtn}
              >
                ❌ Remove
              </button>
            </li>
          );
        })}
      </ul>

      <hr />

      {/* ADD GAMES */}
      <h4>Add More Games</h4>
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
        {availableGames.map((g) => (
          <option key={g._id} value={g._id}>
            {g.name}
          </option>
        ))}
      </select>

      <button onClick={handleAddGames} style={styles.addBtn}>
        Add Selected Games
      </button>

      <button onClick={handleSave} style={styles.saveBtn}>
        Save & Update Record
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "20px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    fontFamily: "sans-serif",
  },
  label: { fontWeight: "bold" },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  toggleBtn: {
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "25px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  gameItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  removeBtn: {
    background: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    padding: "2px 8px",
  },
  multiSelect: {
    width: "100%",
    height: "120px",
    marginTop: "10px",
  },
  addBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "10px",
    background: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },
  saveBtn: {
    marginTop: "15px",
    width: "100%",
    padding: "12px",
    background: "#2c3e50",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },
};
