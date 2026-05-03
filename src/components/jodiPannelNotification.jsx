import React, { useEffect, useState } from "react";
import "./Comman.css";
import { api } from "../lib/api";

function JodiPannelNotification() {
  const [formData, setFormData] = useState({
    message: "",
    number: "",
  });
  const token = localStorage.getItem("authToken");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api("/AllGames/get-message-panel-jodi");
      const result = res;

      if (result.success) {
        setData(result.data);
        setFormData({
          message: result.data?.message || "",
          number: result.data?.number || "",
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api("/AllGames/add-message-panel-jodi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = res;

      if (result.success) {
        alert("Saved successfully!");
        fetchData();
      } else {
        alert(result.message || "Failed to save");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 WhatsApp link generator
  const getWhatsappLink = (number) => {
    const clean = number;
    return `https://wa.me/${clean}`;
  };

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

  return (
    <div className="jpn-container">
      {/* 🔥 USER DISPLAY (like your screenshot) */}
      {data && (
        <a
          href={getWhatsappLink(data.number)}
          target="_blank"
          rel="noopener noreferrer"
          className="jpn-full-btn"
        >
          <div className="jpn-btn-content">
            <h3 className="jpn-btn-text">{data.message}</h3>

            <div className="jpn-btn-bottom">
              {/* WhatsApp SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="#25D366"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.855L.057 23.514a.75.75 0 00.929.929l5.653-1.476A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.946 0-3.772-.525-5.34-1.44l-.383-.228-3.955 1.034 1.053-3.845-.25-.4A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>

              <span className="jpn-btn-label">Connect US</span>
            </div>
          </div>
        </a>
      )}

      {/* 🔹 Admin Form */}
      {role == "Admin" ? (
        <form onSubmit={handleSubmit} className="jpn-form">
          <div className="jpn-form-group">
            <label className="jpn-label">Message</label>
            <input
              type="text"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="jpn-input"
              required
            />
          </div>

          <div className="jpn-form-group">
            <label className="jpn-label">Number</label>
            <input
              type="text"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className="jpn-input"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="jpn-button">
            {loading ? "Saving..." : "Save / Update"}
          </button>
        </form>
      ) : (
        ""
      )}
    </div>
  );
}

export default JodiPannelNotification;
