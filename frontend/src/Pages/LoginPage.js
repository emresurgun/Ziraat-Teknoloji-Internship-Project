import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
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
      const res = await fetch("http://localhost:5268/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      if (!data.token || typeof data.token !== "string") {
        setError("Invalid token received from server.");
        return;
      }

      localStorage.setItem("token", data.token);

      const decoded = jwtDecode(data.token);
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      if (role === "Admin") {
        navigate("/admin");
      } else {
        navigate("/products");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f5f7fa",
      padding: "20px",
    }}>
      <form
        style={{
          backgroundColor: "#fff",
          padding: "30px 40px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          minWidth: "320px",
          maxWidth: "400px",
          width: "100%",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        noValidate
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>

        <label htmlFor="username" style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px", color: "#333" }}>
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", marginBottom: "20px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }}
          required
          autoComplete="username"
        />

        <label htmlFor="password" style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px", color: "#333" }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", marginBottom: "20px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box" }}
          required
          autoComplete="current-password"
        />

        {error && <p style={{ color: "red", marginTop: "-15px", marginBottom: "20px", fontSize: "14px" }}>{error}</p>}

        <button type="submit" style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          borderRadius: "4px",
          border: "none",
          backgroundColor: "#007bff",
          color: "#fff",
          fontWeight: "600",
          cursor: "pointer",
        }}>
          Login
        </button>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#6c757d",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "10px",
          }}
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default LoginPage;