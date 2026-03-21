import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../components/Header";
import { jwtDecode } from "jwt-decode";
const AllUsersPage = () => {
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

  useEffect(() => {
    if (role !== "Admin") {
      navigate("/");
    }
  }, [role]);

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search state
  const [searchText, setSearchText] = useState("");

  // Inline password edit states
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api("/user/allWithPassword");

      if (data && data.success) {
        setUsers(data.data);
      } else {
        setError(data?.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Server error while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle password update inline
  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    try {
      const res = await api(`/user/updatePassword/${selectedUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res && res.success) {
        toast.success("Password updated successfully!");
        setSelectedUser(null);
        setNewPassword("");
        loadUsers();
      } else {
        toast.error(res?.message || "Failed to update password");
      }
    } catch (err) {
      console.error("Password update error:", err);
      toast.error("Server error while updating password");
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmDelete) return;

    try {
      const res = await api(`/user/delete/${userId}`, {
        method: "DELETE",
      });

      if (res && res.success) {
        toast.success("User deleted successfully!");
        loadUsers(); // refresh list
      } else {
        toast.error(res?.message || "Failed to delete user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Server error while deleting user");
    }
  };

  if (loading)
    return <div className="text-center p-8 text-lg font-bold">Loading...</div>;

  if (error)
    return <div className="text-center p-8 text-red-500 text-lg">{error}</div>;

  // FILTER USERS BY NAME
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6" style={{ backgroundColor: "#fc9" }}>
      <Header />
      <h2 className="text-xl md:text-2xl font-semibold mb-4">All Users 👥</h2>

      {/* 🔍 Search Box */}
      <input
        type="text"
        placeholder="Search by name..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      {/* SIMPLE RESPONSIVE USER LIST */}
      <div className="space-y-4">
        {filteredUsers.map((u) => (
          <div
            key={u._id}
            className="rounded-lg p-4 shadow-sm"
            style={{ background: "#FFF4E6", border: "2px solid #ffcc99" }}
          >
            {/* USER INFO */}
            <div className="text-sm space-y-1">
              <p>
                <b>Name:</b> {u.name}
              </p>
              <p>
                <b>Role:</b> {u.role}
              </p>
              <p>
                <b>Mobile:</b> {u.mobile}
              </p>
              <p>
                <b>Address:</b> {u.address}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {selectedUser?._id === u._id ? (
                <div className="parent-of-sumbit">
                  <input
                    type="text"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w=1/2 p-2 border rounded mb-2"
                  />
                  <div>
                    <button
                      onClick={handlePasswordUpdate}
                      className="btn btn-success text-sm py-1 px-3 rounded"
                    >
                      Submit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setNewPassword("");
                      }}
                      className="btn btn-danger text-sm py-1 px-3 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setNewPassword("");
                    }}
                    className="btn btn-info text-sm py-1 px-3 m-2 rounded"
                  >
                    Edit Password
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u._id)}
                    className="btn btn-danger text-sm py-1 px-3 m-2 rounded"
                  >
                    Delete User
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
};

export default AllUsersPage;
