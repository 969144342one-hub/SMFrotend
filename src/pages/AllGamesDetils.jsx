import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { jwtDecode } from "jwt-decode";

const AllGamesDetails = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  let role = null;
  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch {}
  }

  useEffect(() => {
    if (role !== "Admin") navigate("/");
  }, [role, navigate]);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const loadGames = async () => {
    try {
      const res = await api("/AllGames/detils");
      if (res?.success && Array.isArray(res.data)) {
        setGames(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const filteredGames = games.filter((g) =>
    g.name?.toLowerCase().includes(searchText.toLowerCase()),
  );
  const tdStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};


  if (loading)
    return <div className="p-6 text-center font-semibold">Loading...</div>;

 return (
  <div
    style={{
      minHeight: "100vh",
      backgroundColor: "#fc9",
      display: "flex",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
    }}
  >
    {/* MAIN CONTAINER */}
    <div
      style={{
        width: "100%",
        maxWidth: "1200px",
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <Header />

      <h2
        style={{
          textAlign: "center",
          marginBottom: "16px",
          fontSize: "22px",
          fontWeight: "bold",
        }}
      >
        All Games 🎮
      </h2>

      {/* SEARCH */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <input
          placeholder="Search game..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: "60%",
            minWidth: "250px",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#fde68a" }}>
              {[
                "Name",
                "Owner",
                "Start",
                "End",
                "Live",
                "Status",
                "Notify",
                "Font",
                "Colors",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredGames.map((g) => (
              <tr key={g._id} style={{ backgroundColor: "#fff" }}>
                <td style={tdStyle}><b>{g.name}</b></td>
                <td style={tdStyle}>{g.owner}</td>
                <td style={tdStyle}>{g.startTime}</td>
                <td style={tdStyle}>{g.endTime}</td>
                <td style={tdStyle}>{g.liveTime}</td>
                <td style={tdStyle}>{g.status}</td>

                {/* NOTIFICATION */}
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor:
                        g.IsNotification === "Yes" ? "#fde047" : "#86efac",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {g.IsNotification}
                  </span>
                </td>

                <td style={tdStyle}>{g.fontSize}px</td>

                {/* COLORS */}
                <td style={tdStyle}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[g.nameColor, g.resultColor, g.panelColor, g.notificationColor].map(
                      (c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "20px",
                              height: "20px",
                              backgroundColor: c,
                              border: "1px solid #000",
                              borderRadius: "4px",
                            }}
                          />
                          <span style={{ fontSize: "12px" }}>{c}</span>
                        </div>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

};

export default AllGamesDetails;
