import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (!password.trim()) {
      setError("Password cannot be empty.");
      return;
    }

    try {
      setError("");
      
      // Try to register first
      const res = await fetch("http://localhost:5268/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // Check if registration was successful
      if (res.ok) {
        // Registration successful, now login the user
        try {
          const loginRes = await fetch("http://localhost:5268/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          if (loginRes.ok) {
            const loginData = await loginRes.json();
            
            // Handle both token and Token field names
            const token = loginData.token || loginData.Token;
            
            if (token) {
              localStorage.setItem("token", token);
              const decoded = jwtDecode(token);
              const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

              alert("Register successful");

              if (role === "Admin") {
                navigate("/admin");
              } else {
                navigate("/user/products");
              }
              return;
            }
          }
          
          // If login fails, still show success (registration worked)
          alert("Registration successful! Please login with your credentials.");
          navigate("/login");
          
        } catch (loginErr) {
          // Login failed but registration worked
          alert("Registration successful! Please login with your credentials.");
          navigate("/login");
        }
        
      } else {
        // Registration failed - check why
        let errorData = null;
        try {
          errorData = await res.json();
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        console.log("Registration error data:", errorData); // Debug log
        
        if (errorData && errorData.message) {
          const errorMessage = errorData.message.toLowerCase();
          if (errorMessage.includes("already exists") || 
              errorMessage.includes("username") || 
              errorMessage.includes("taken") ||
              errorMessage.includes("duplicate") ||
              errorMessage.includes("user") ||
              errorMessage.includes("exist")) {
            setError("Username already exists. Please choose a different username.");
          } else {
            setError("Registration failed: " + errorData.message);
          }
        } else if (res.status === 400 || res.status === 409) {
          // Common status codes for duplicate username
          setError("Username already exists. Please choose a different username.");
        } else {
          setError("Registration failed. Please try a different username.");
        }
      }
      
    } catch (err) {
      setError("Connection error. Please check your internet connection and try again.");
    }
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#26292B", // Mercedes grisi
    padding: 0,
    margin: 0
  };

  const formStyle = {
    backgroundColor: "#fff",
    padding: "30px 40px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    minWidth: "320px",
    maxWidth: "400px",
    width: "100%",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    fontSize: "14px",
    color: "#333",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    marginBottom: "20px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  };

  const errorStyle = {
    color: "red",
    marginTop: "-15px",
    marginBottom: "20px",
    fontSize: "14px",
  };

  return (
    <div style={containerStyle}>
      <form
        style={formStyle}
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
        noValidate
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Register</h2>

        <label htmlFor="username" style={labelStyle}>
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
          autoComplete="username"
        />

        <label htmlFor="password" style={labelStyle}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          autoComplete="current-password"
        />

        {error && <p style={errorStyle}>{error}</p>}

        <button type="submit" style={buttonStyle}>
          Register
        </button>

        <button
          type="button"
          style={{
            ...buttonStyle,
            backgroundColor: "#6c757d",
            marginTop: "10px",
          }}
          onClick={() => navigate("/login")}
        >
          Go back to login page
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;