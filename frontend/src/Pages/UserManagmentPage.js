import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function UserManagmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "User" });
  const [editStates, setEditStates] = useState({}); // Track which users are in edit mode
  const [passwordStates, setPasswordStates] = useState({}); // Track which users are in password change mode
  const [passwordInputs, setPasswordInputs] = useState({}); // Track new password values
  const [message, setMessage] = useState(""); // For success messages

  const token = localStorage.getItem("token");

  // Check authentication and admin role
  useEffect(() => {
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
        navigate("/login");
        return;
      }
      setLoading(false);
    } catch (err) {
      alert("Token is invalid or expired.");
      navigate("/login");
    }
  }, [navigate, token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5268/api/SeeAllUsers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch users.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const handleDelete = async (username) => {
    try {
      const res = await fetch("http://localhost:5268/api/DeleteUser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error("Failed to delete user.");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Error deleting user.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5268/api/CreateNewUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create user.");
      }
      setNewUser({ username: "", password: "", role: "User" });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditToggle = (username) => {
    setEditStates((prev) => {
      // Only allow one edit at a time
      const newStates = {};
      Object.keys(prev).forEach(k => newStates[k] = false);
      // Toggle this one
      newStates[username] = !prev[username];
      return newStates;
    });
    // Reset any password states when entering edit mode
    if (!editStates[username]) {
      setPasswordStates(prev => ({ ...prev, [username]: false }));
      setPasswordInputs(prev => ({ ...prev, [username]: "" }));
    }
  };

  const handleUserUpdate = async (username, newUsername, newRole) => {
    try {
      let updated = false;
      
      // Update username if changed
      if (newUsername !== username) {
        if (!newUsername || newUsername.trim() === "") {
          setError("Username cannot be empty.");
          return false;
        }

        const res = await fetch("http://localhost:5268/api/ChangeUsername", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            OldUsername: username,
            NewUsername: newUsername.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "Failed to update username.");
          return false;
        }
        updated = true;
      }

      // Update role if changed
      const user = users.find(u => u.username === username);
      if (user && newRole !== user.role) {
        const res = await fetch("http://localhost:5268/api/ChangeUserRole", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            Username: username,
            NewRole: newRole
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "Failed to update role.");
          return false;
        }
        updated = true;
      }

      if (updated) {
        showMessage("User updated successfully!");
      }
      setError("");
      setEditStates(prev => ({ ...prev, [username]: false }));
      await fetchUsers();
      return true;
    } catch (err) {
      setError("An error occurred while updating the user.");
      return false;
    }
  };

  const handlePasswordToggle = (username) => {
    setPasswordStates((prev) => ({ ...prev, [username]: !prev[username] }));
    setPasswordInputs((prev) => ({ ...prev, [username]: "" }));
  };

  const handlePasswordChange = async (username) => {
    const newPassword = passwordInputs[username];
    if (!newPassword || newPassword.trim().length < 4) {
      alert("New password must be at least 4 characters.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5268/api/UpdatePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ Username: username, NewPassword: newPassword }),
      });
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) {
        alert(data?.message || "Failed to change password.");
        return;
      }
      alert("Password changed successfully.");
      setPasswordStates((prev) => ({ ...prev, [username]: false }));
      setPasswordInputs((prev) => ({ ...prev, [username]: "" }));
    } catch (err) {
      alert("An error occurred while changing the password.");
    }
  };

  if (loading) {
    return <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#26292B", minHeight: "100vh", color: "#fff", textAlign: "center" }}>
      <h2 style={{ color: "#28a745" }}>Loading User Management...</h2>
    </div>;
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#26292B", minHeight: "100vh", color: "#fff" }}>
      <button
        onClick={() => window.location.href = "/admin"}
        style={{ marginBottom: "18px", padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
      >
        Back to Main Menu
      </button>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "24px", color: "#fff" }}>User Management</h2>
      {message && <p style={{ color: "#28a745", fontSize: "1.2rem", marginBottom: "10px" }}>{message}</p>}
      {error && <p style={{ color: "red", fontSize: "1.2rem", marginBottom: "10px" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px" }}>
        <h3 style={{ fontSize: "1.3rem", marginRight: "18px", color: "#fff" }}>Create New User</h3>
        <input
          type="text"
          placeholder="Username"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <select
          value={newUser.role}
          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb" }}
        >
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
        <button type="submit" style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#007bff", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>Create</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", color: "#fff" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", color: "#fff" }}>Username</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", color: "#fff" }}>Role</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px", color: "#fff" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.filter(user => user.username !== "admin").map((user) => {
            const isEditing = editStates[user.username];
            const isChangingPassword = passwordStates[user.username];
            
            return (
              <tr key={user.id}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  <span style={{ fontSize: "16px", padding: "10px 16px", display: "inline-block", minWidth: "60px" }}>{user.id}</span>
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={user.username}
                      style={{
                        width: "180px",
                        fontSize: "16px",
                        padding: "10px 16px",
                        borderRadius: "4px",
                        border: "1px solid #bbb",
                        marginLeft: "8px"
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "10px 16px", display: "inline-block", minWidth: "120px", marginLeft: "8px" }}>{user.username}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <select
                      defaultValue={user.role}
                      style={{ fontSize: "16px", padding: "10px 16px", borderRadius: "4px", border: "1px solid #bbb" }}
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <>
                      <button 
                        onClick={(e) => {
                          const row = e.target.closest('tr');
                          const newUsername = row.querySelector('input').value;
                          const newRole = row.querySelector('select').value;
                          handleUserUpdate(user.username, newUsername, newRole);
                        }}
                        style={{ marginRight: "10px", marginTop: "4px", padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleEditToggle(user.username)}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {!isEditing && !isChangingPassword && (
                        <>
                          <button
                            onClick={() => handleEditToggle(user.username)}
                            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#ffc107", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePasswordToggle(user.username)}
                            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#17a2b8", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                          >
                            Change Password
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this user?")) {
                                handleDelete(user.username);
                              }
                            }}
                            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {isChangingPassword && (
                    <div style={{ marginTop: "10px" }}>
                      <input
                        type="password"
                        value={passwordInputs[user.username] || ""}
                        onChange={(e) => setPasswordInputs(prev => ({ ...prev, [user.username]: e.target.value }))}
                        placeholder="New Password"
                        style={{ fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb", marginRight: "8px" }}
                      />
                      <button 
                        onClick={() => handlePasswordChange(user.username)}
                        style={{ marginRight: "10px", marginTop: "4px", padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Save Password
                      </button>
                      <button
                        onClick={() => handlePasswordToggle(user.username)}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagmentPage;