import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // If no token, redirect to login page
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      if (role !== "Admin") {
        alert("You do not have permission to access this page!");
        navigate("/products");
        return;
      }
      setLoading(false);
    } catch (err) {
      alert("Token is invalid or expired.");
      navigate("/login");
    }
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  const containerStyle = {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
    borderRadius: "8px",
    backgroundColor: "#f0f2f5",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: "center",
  };

  const titleStyle = {
    marginBottom: "30px",
    color: "#333",
  };

  const buttonStyle = {
    display: "block",
    width: "100%",
    padding: "14px",
    margin: "12px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
    backgroundColor: "#007bff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Admin Panel</h1>

      <button style={buttonStyle} onClick={() => navigate("/admin/users")}>User Management</button>
      <button style={buttonStyle} onClick={() => navigate("/admin/products")}>Product Management</button>
      <button style={buttonStyle} onClick={() => navigate("/admin/categories")}>Category Management</button>
      <button
        style={{ ...buttonStyle, backgroundColor: "#dc3545", marginTop: "30px" }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}

export default AdminPage;