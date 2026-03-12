import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import PanelMatkaTable from "../components/PanelMatkaTable";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

const PanelPage = () => {
  const [singleGameData, setSingleGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  const fetchSingleGameData = async () => {
    try {
      const data = await api(`/AllGames/${id}`);
      if (data.success) {
        setSingleGameData(data.data || null);
      } else {
        setError("Failed to fetch game data.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchSingleGameData();
  }, [id]);

  if (loading) return <div>Loading game data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!singleGameData) return <div>No game found.</div>;

  // ------------------------
  // Group by DATE
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

  // ------------------------
  // Convert to groupedByDay
  // ------------------------
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const groupedByDay = {};
  const groupedByDayOpen = {};
  dayNames.forEach((d) => {
    groupedByDay[d] = [];
    groupedByDayOpen[d] = [];
  });

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

  sortedDateKeys.forEach((dateKey) => {
    const item = groupedByDate[dateKey];
    const day = item.day || new Date(dateKey).toLocaleDateString("en-US", { weekday: "long" });
    const open = item.open || ["", "", dateKey, "Open", day];
    const close = item.close || ["", "", dateKey, "Close", day];

    if (!groupedByDayOpen[day]) groupedByDayOpen[day] = [];
    if (!groupedByDay[day]) groupedByDay[day] = [];

    groupedByDayOpen[day].push(open);
    groupedByDay[day].push(close);
  });

  const baseDateFromData = sortedDateKeys.length > 0
    ? sortedDateKeys[0]
    : new Date().toISOString().split("T")[0];

  // ------------------------
  // Latest result for display (most recent = last item)
  // ------------------------
  const latestOpen = singleGameData.openNo?.at(-1);
  const latestClose = singleGameData.closeNo?.at(-1);
  const resultDisplay = latestOpen && latestClose
    ? `${latestOpen[0]}-${latestOpen[1]}${latestClose[1]}-${latestClose[0]}`
    : "**-**";

  const description = `Dpboss ${singleGameData.name} jodi chart...`;

  return (
    <div className="bg-danger border m-1 border-danger text-center">
      <Header />

      <div className="border m-1 border-danger text-center" style={{ backgroundColor: "Pink" }}>
        <h3>{singleGameData.name} JODI CHART</h3>
      </div>

      <div className="bg-warning m-1 border border-white py-3 text-center">
        <p>{description}</p>
      </div>

      <div className="border m-1 border-danger text-center" style={{ backgroundColor: "Pink" }}>
        <h3>{singleGameData.name}</h3>
        {/* ✅ Safe result display */}
        <h3>{resultDisplay}</h3>
      </div>

      <PanelMatkaTable
        groupedData={groupedByDay}
        groupedByDayOpen={groupedByDayOpen}
        gameName={singleGameData.name}
        baseDateFromData={baseDateFromData}
        noOfDays={singleGameData.noOfDays}
      />

      <div className="border m-1 border-danger text-center" style={{ backgroundColor: "Pink" }}>
        <h3>{singleGameData.name}</h3>
        <h3>{resultDisplay}</h3>
      </div>
    </div>
  );
};

export default PanelPage;