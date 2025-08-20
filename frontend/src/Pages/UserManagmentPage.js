import React, { useEffect, useState } from "react";

function UserManagmentPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "User" });
  const [editStates, setEditStates] = useState({}); // Track which users are in edit mode

  const token = localStorage.getItem("token");

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

  const handleEditToggle = (username) => {
    setEditStates((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const handleUsernameChange = async (oldUsername, newUsername) => {
    if (!newUsername || newUsername.trim() === "" || oldUsername === newUsername) {
      alert("New username cannot be empty or same as old one.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5268/api/ChangeUsername", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          OldUsername: oldUsername,
          NewUsername: newUsername.trim(),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = {};
      }

      if (!res.ok) {
        // Try to show a user-friendly error
        if (data?.message && data.message.toLowerCase().includes("already taken")) {
          alert("This username is already in use. Please choose another one.");
        } else if (data?.message) {
          alert(data.message);
        } else {
          alert("Failed to update username. The username may already exist or does not match the required pattern.");
        }
        return;
      }

      setEditStates((prev) => ({ ...prev, [oldUsername]: false }));
      fetchUsers();
    } catch (err) {
      alert("An error occurred while updating the username.");
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "24px" }}>User Management</h2>
      {error && <p style={{ color: "red", fontSize: "1.2rem" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px" }}>
        <h3 style={{ fontSize: "1.3rem", marginRight: "18px" }}>Create New User</h3>
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
        <button type="submit" style={{ fontSize: "1.1rem", padding: "10px 28px", borderRadius: "5px", background: "#007bff", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>Create</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Username</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Role</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isEditing = editStates[user.username];
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
                      onBlur={(e) => handleUsernameChange(user.username, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUsernameChange(user.username, e.target.value);
                        }
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "10px 16px", display: "inline-block", minWidth: "120px", marginLeft: "8px" }}>{user.username}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>{user.role}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  <button
                    onClick={() => handleEditToggle(user.username)}
                    style={{
                      padding: "10px 24px",
                      fontSize: "16px",
                      borderRadius: "4px",
                      marginRight: "10px",
                      marginTop: "4px"
                    }}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(user.username)}
                    style={{
                      padding: "10px 24px",
                      fontSize: "16px",
                      borderRadius: "4px",
                      marginTop: "4px"
                    }}
                  >
                    Delete
                  </button>
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