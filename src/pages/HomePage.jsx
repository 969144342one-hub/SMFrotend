// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import ReactDOM from "react-dom"; // Import ReactDOM for Portals
import Header from "../components/Header";
import WelcomeBanner from "../components/WelcomeBanner";
import InfoSection from "../components/InfoSection";
import LuckyNumberSection from "../components/LuckyNumberSection";
import LiveResultSection from "../components/LiveResultSection";
import NoticeSection from "../components/NoticeSection";
import JodiPannelResultSection from "../components/JodiPannelResultSection";
import MatkaDivisionName from "../components/MatakaDivisionName";
import StarlStarlineSectionineTable from "../components/StarlineSection";
import MainBombay36Bazar from "../components/MainBombay36Bazar";
import DpBossPage from "../components/DpBossPage";
import UserPayments from "../components/AgentList";
import NotificationPage from "../components/NoticationPage";
import AllPageLink from "../components/allLinkPage";
import ApiPoller from "../components/ApiCaller";
import GuessingChartDisplay from './GuessingChartDisplay'
import { api } from "../lib/api";
import { jwtDecode } from "jwt-decode";
import {useNavigate} from 'react-router-dom'

// --- New Component for Static Buttons ---

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
// ------------------------------------------

const HomePage = ({ setGameTitle }) => {
  const [responseNotification, setResponseNotification] = useState([]);
  const [isGameOwner, setIsGameOwner] = useState(false);
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate()

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

  // --- Fetch Notifications (Logic remains the same) ---
  const handleGetNotification = async () => {
    const API_URL = "/Notification/update-noti";
    try {
      const apiResponse = await api(API_URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!apiResponse) throw new Error("No response from server");

      let notificationsArray = [];
      if (Array.isArray(apiResponse)) {
        notificationsArray = await apiResponse;
      } else if (typeof apiResponse === "object") {
        notificationsArray = Object.values(apiResponse).filter(
          (item) => item && typeof item === "object" && item.name,
        );
      }

      if (!notificationsArray.length) {
        console.warn("No notifications found");
        setResponseNotification([]);
        return;
      }
      setResponseNotification(notificationsArray);
    } catch (error) {
      console.error("❌ Error retrieving notification:", error);
    }
  };

  // --- Fetch once on mount (Logic remains the same) ---
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await handleGetNotification();
        if (isMounted) result;
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!username || role === "Admin") return;

    const fetchOwnedGames = async () => {
      try {
        const data = await api("/AllGames/");

        if (data.success && Array.isArray(data.data)) {
          setIsGameOwner(data.data.some((game) => game.owner === username));
        }
      } catch (err) {
        console.error("Error checking game owner:", err);
      }
    };

    fetchOwnedGames();
  }, [role, username]);

  return (
    <>
      {/* 🛑 CONDITIONAL RENDERING FOR ADMIN BUTTONS */}
      <StaticButtons />

      {/* Existing Page Content */}
      <div
        className="border border-danger text-center col-12"
        style={{ backgroundColor: "#f2c38b", width: "100%" }}
      >
        {/* Page Sections */}
        <Header />
        <WelcomeBanner />
        {role === "Admin" || isGameOwner ?
        <button onClick={() => navigate("/admin/guessing")}>
          Add Guessing Chart
        </button> : ""}
        
        {/* <button onClick={() => navigate("/guessing-chart")}>
          Guessing Chart
        </button> */}
        {/* Pass the first notification object safely */}
        {responseNotification.length > 0 && (
          <NotificationPage
            role={role}
            notificationMessage={responseNotification[0]}
          />
        )}
        <InfoSection />
        {role === "Admin" && <ApiPoller />}
        <NotificationPage
          role={role}
          notificationMessage={responseNotification?.[1] || {}}
        />
        {/* This existing check is redundant if you're using role === "Admin" above, but maintained here */}
        {role === "Admin" && <UserPayments />}
        {/* <LuckyNumberSection /> */}
        <LiveResultSection />
        <NoticeSection />
        <MatkaDivisionName />
        <JodiPannelResultSection setGameTitle={setGameTitle} />
        <NotificationPage
          role={role}
          notificationMessage={responseNotification?.[2] || {}}
        />
        <StarlStarlineSectionineTable
          role={role}
          messagefor5="5"
          notificationMessage={responseNotification?.[4] || {}}
        />
        {/* <NotificationPage
          role={role}
          messagefor5="5"
          notificationMessage={responseNotification?.[4] || {}}
        /> */}
        {/* <MainBombay36Bazar /> */}
        <GuessingChartDisplay/>
        <AllPageLink page={"JodiPanPage"} />
        <AllPageLink page={"PanelPage"} />
        {/* <AddGuessingChart/>
         */}
        <NotificationPage
          role={role}
          notificationMessage={responseNotification?.[3] || {}}
        />
        <DpBossPage />
      </div>
    </>
  );
};

export default HomePage;
