import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Username cannot be empty.");
      return;
    }
    if (!password.trim()) {
      setError("Password cannot be empty.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5268/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 409) {
        // 409 Conflict status for username taken
        const data = await res.json();
        setError(data.message || "Username is already taken.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed.");
        return;
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Network error. Please try again later.");
    }
  };

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f7fa",
    padding: "20px",
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
    backgroundColor: "#28a745",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  };

  const errorStyle = {
    color: "red",
    marginBottom: "20px",
    fontSize: "14px",
  };

  const successStyle = {
    color: "green",
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
          autoComplete="username"
          required
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
          autoComplete="new-password"
          required
        />

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <button type="submit" style={buttonStyle}>
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;