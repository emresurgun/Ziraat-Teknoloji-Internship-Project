import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function UserSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Username change form
  const [oldUsername, setOldUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);
  
  // Password change form
  const [targetUsername, setTargetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const token = localStorage.getItem("token");

  // Check authentication
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const username = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      
      setUser({ username, role });
      setOldUsername(username);
      setTargetUsername(username);
      setLoading(false);
    } catch (err) {
      alert("Token is invalid or expired.");
      navigate("/login");
    }
  }, [navigate, token]);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setError("New username cannot be empty.");
      return;
    }
    
    if (newUsername === oldUsername) {
      setError("New username must be different from current username.");
      return;
    }

    setUsernameLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5268/api/ChangeUsername", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldUsername: oldUsername,
          newUsername: newUsername,
        }),
      });

      console.log("Response status:", res.status); // Debug log
      console.log("Response ok:", res.ok); // Debug log

      let data = null;
      try {
        data = await res.json();
        console.log("Response data:", data); // Debug log
      } catch (jsonErr) {
        console.log("JSON parse error:", jsonErr); // Debug log
        // If response is not JSON, handle based on status code
        if (res.status === 400 || res.status === 409) {
          setError("This username is already taken. Please choose a different one.");
          return;
        }
      }

      if (res.ok) {
        setSuccess("Username updated successfully! Please login again with your new username.");
        
        // Clear token and redirect to login after 2 seconds
        setTimeout(() => {
          localStorage.removeItem("token");
          navigate("/login");
        }, 2000);
      } else {
        if (data && data.message) {
          const errorMessage = data.message.toLowerCase();
          if (errorMessage.includes("already taken") || 
              errorMessage.includes("taken") ||
              errorMessage.includes("already exists") ||
              errorMessage.includes("duplicate") ||
              errorMessage.includes("exist")) {
            setError("This username is already taken. Please choose a different one.");
          } else {
            setError(data.message);
          }
        } else {
          // No message but not ok - likely a duplicate username
          if (res.status === 400 || res.status === 409) {
            setError("This username is already taken. Please choose a different one.");
          } else {
            setError("Failed to update username.");
          }
        }
      }
    } catch (err) {
      console.log("Network error:", err); // Debug log
      setError("Connection error. Please check your internet connection and try again.");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError("New password cannot be empty.");
      return;
    }
    
    if (newPassword.length < 3) {
      setError("Password must be at least 3 characters long.");
      return;
    }

    setPasswordLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5268/api/UpdatePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: targetUsername,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password updated successfully!");
        setNewPassword("");
      } else {
        setError(data.message || "Failed to update password.");
      }
    } catch (err) {
      setError("Error updating password. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh", 
        backgroundColor: "#26292B", 
        color: "#fff", 
        fontSize: "1.5rem" 
      }}>
        Loading...
      </div>
    );
  }

  const containerStyle = {
    padding: "30px",
    fontFamily: "Arial",
    backgroundColor: "#26292B",
    minHeight: "100vh",
    color: "#fff"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px"
  };

  const formStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "8px",
    marginBottom: "30px",
    color: "#333"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "15px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box"
  };

  const buttonStyle = {
    padding: "12px 24px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    marginRight: "10px"
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    cursor: "not-allowed"
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "2.5rem", margin: "0", color: "#fff" }}>User Settings</h1>
          <p style={{ margin: "5px 0", color: "#ccc", fontSize: "1.1rem" }}>
            Welcome, {user?.username} ({user?.role})
          </p>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button
            onClick={() => navigate("/user/products")}
            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Back to Products
          </button>
          {user?.role === "Admin" && (
            <button
              onClick={() => navigate("/admin")}
              style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#17a2b8", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && <p style={{ color: "red", fontSize: "1.2rem", marginBottom: "20px", textAlign: "center" }}>{error}</p>}
      {success && <p style={{ color: "green", fontSize: "1.2rem", marginBottom: "20px", textAlign: "center" }}>{success}</p>}

      {/* Username Change Form */}
      <div style={formStyle}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Change Username</h2>
        <form onSubmit={handleUsernameChange}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Current Username:
            </label>
            <input
              type="text"
              value={oldUsername}
              disabled
              style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#6c757d" }}
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              New Username:
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              style={inputStyle}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={usernameLoading}
            style={usernameLoading ? disabledButtonStyle : buttonStyle}
          >
            {usernameLoading ? "Updating..." : "Update Username"}
          </button>
        </form>
      </div>

      {/* Password Change Form */}
      <div style={formStyle}>
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Change Password</h2>
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Username:
            </label>
            <input
              type="text"
              value={targetUsername}
              disabled
              style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#6c757d" }}
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              New Password:
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={passwordLoading}
            style={passwordLoading ? disabledButtonStyle : buttonStyle}
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UserSettingsPage;
