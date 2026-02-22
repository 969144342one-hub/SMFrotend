import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const InfoSection = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");
  let role = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
      
    } catch (err) {
      console.error("Invalid token", err);
    }
  }

  return (
    <div className="border border-white text-center p-3" style={{ backgroundColor: "#ffcc99", border:"1px solid red" }}>
      <h2 className="Heading-infosection">Satta Matka Aajj Tak</h2>
      <h2 className="Heading-infosection">Kalyan Matka Result</h2>

      {role === "Admin" && (
        <button className="btn btn-info" onClick={() => navigate("/allUser")}>
          Update User Password
        </button>
      )}

      {role === "Admin" && (
        <button className="btn btn-info" style={{margin:"10px"}} onClick={() => navigate("/allDetils")}>
          Check the game status
        </button>
      )}
    </div>
  );
};

export default InfoSection;
