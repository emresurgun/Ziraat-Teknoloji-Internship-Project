import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function HomePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      // No token, redirect to login
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      // Redirect based on role
      if (role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/user/products");
      }
    } catch (err) {
      // Invalid token
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate, token]);

  // Show loading while redirecting
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#26292B", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      color: "#fff", 
      fontSize: "1.5rem",
      fontFamily: "Arial"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "5px solid #444",
            borderTop: "5px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}></div>
        </div>
        <p>Redirecting...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default HomePage;
