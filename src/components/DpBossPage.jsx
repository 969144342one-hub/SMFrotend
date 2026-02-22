import React from "react";
import "./Comman.css";

const DpBossPage = () => {
  return (
    <div className="dpboss-wrapper">


      {/* ===== Notice Section ===== */}
      <div className="notice-section">
        <div className="notice-title">☆ NOTICE ☆</div>

        <p style={{fontWeight:"bold"}}>
          अपना बाजार <strong>Satta Matka Aajj Tak</strong> वेबसाइट में डालवाने
          के लिए आज ही हमें संपर्क करें
        </p>

        <p className="email">
          Whatapp No : 9203516304
        </p>

        <p>शर्ते लागू</p>
      </div>

      {/* ===== Red Announcement Section ===== */}
      <div className="red-info-section">
        <p className="main-text" style={{fontWeight:"bold"}}>
          अब सभी मटका बाजार खेले ऑनलाइन ऐप पर रोज खेले रोज कमाओ अभी डाउनलोड करो
        </p>
        <button className="fastMatkaPlay"> Fast Matka Play</button>
        <p>Back Again With New Options - 100% Trusted</p>
        <p>Fast Payin - Instant Withdraw</p>
      </div>

      {/* ===== Top Copyright Bar ===== */}
      <div className="top-header">
        © 2011 - 2026 Satta Matka Aajj Tak | About us | Contact us <br />
        Privacy & Policy | Term And Conditions | Result Api
      </div>
      {/* ===== Footer ===== */}
      <div className="footer">
        © 2026 Satta Matka Aajj Tak. All Rights Reserved.
      </div>

    </div>
  );
};

export default DpBossPage;