import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const outerStyle = {
    minHeight: "100vh",
    backgroundColor: "#26292B", // Mercedes grisi
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };

  const containerStyle = {
    width: "400px",
    margin: "40px auto",
    padding: "25px",
    borderRadius: "16px",
    backgroundColor: "#fff", // kutu beyaz
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    textAlign: "center",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  };

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

  if (loading) return <div style={outerStyle}>Loading...</div>;

  const titleStyle = {
    marginBottom: "20px",
    color: "#333",
  };

  const buttonStyle = {
    display: "block",
    width: "100%",
    padding: "10px",
    margin: "6px 0",
    fontSize: "16px",
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
    <div style={outerStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Admin Panel</h1>

        <button style={buttonStyle} onClick={() => navigate("/admin/users")}>User Management</button>
        <button style={buttonStyle} onClick={() => navigate("/admin/products")}>Product Management</button>
        <button style={buttonStyle} onClick={() => navigate("/admin/categories")}>Category Management</button>
        
        {/* New button for admins to view as user */}
        <button 
          style={{ ...buttonStyle, backgroundColor: "#28a745", marginTop: "10px" }} 
          onClick={() => navigate("/user/products")}
        >
          View as User
        </button>
        
        <button
          style={{ ...buttonStyle, backgroundColor: "#dc3545", marginTop: "15px" }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminPage;