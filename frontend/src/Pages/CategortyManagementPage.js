import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function CategortyManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [newCategory, setNewCategory] = useState({ categoryName: "", description: "" });
  const [editStates, setEditStates] = useState({});
  const [editInputs, setEditInputs] = useState({});
  const [message, setMessage] = useState("");
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

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5268/api/SeeAllCategories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories.");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // Create category
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    // Always send PascalCase fields as backend expects
    const payload = {
      CategoryName: newCategory.categoryName,
      Description: newCategory.description && newCategory.description.trim() ? newCategory.description.trim() : "No description",
    };
    try {
      const res = await fetch("http://localhost:5268/api/CreateCategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Refetch and check if category was actually created
        fetchCategories();
        setTimeout(() => {
          const exists = categories.some(c => c.categoryName === newCategory.categoryName);
          if (exists) {
            setNewCategory({ categoryName: "", description: "" });
            setError("");
          } else {
            setError(data.message || "Failed to create category.");
          }
        }, 500);
        return;
      }
      setNewCategory({ categoryName: "", description: "" });
      setError("");
      fetchCategories();
    } catch (err) {
      setError("Failed to create category.");
    }
  };

  // Delete category
  const handleDelete = async (categoryName) => {
    if (!categoryName || categoryName.trim() === "") {
      alert("Cannot delete a category with an empty name. Please fix this in the database or contact an admin.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5268/api/DeleteCategory", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ CategoryName: categoryName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category.");
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit category name
  const handleEditToggle = (categoryName) => {
    setEditStates((prev) => {
      // Close all other edit states first
      const newStates = {};
      Object.keys(prev).forEach(k => newStates[k] = false);
      // Toggle this one
      newStates[categoryName] = !prev[categoryName];
      return newStates;
    });
    // Set initial edit inputs
    const category = categories.find(c => c.categoryName === categoryName);
    if (category) {
      setEditInputs((prev) => ({
        ...prev,
        [categoryName]: {
          categoryName: category.categoryName,
          description: category.description
        }
      }));
    }
  };

  const handleCategoryNameChange = async (oldName, newName, description) => {
    if (!oldName || oldName.trim() === "") {
      setError("Cannot update a category with an empty name.");
      return false;
    }

    // Check if nothing has changed
    const category = categories.find(c => c.categoryName === oldName);
    if (category && newName === oldName && description === category.description) {
      // If nothing changed, just close edit mode without error
      setEditStates((prev) => ({ ...prev, [oldName]: false }));
      setEditInputs({});
      setError("");
      return true;
    }

    try {
      let success = true;
      
      // If name changed, update it first
      if (newName !== oldName) {
        if (!newName || newName.trim() === "") {
          setError("New category name cannot be empty.");
          return false;
        }

        const nameRes = await fetch("http://localhost:5268/api/UpdateCategory", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            CurrentCategoryName: oldName,
            NewCategoryName: newName.trim(),
          }),
        });
        
        if (!nameRes.ok) {
          const data = await nameRes.json();
          setError(data?.message || "Failed to update category name.");
          return false;
        }
      }

      // After successful name update (or if name didn't change), update description
      if (description !== category?.description) {
        const descRes = await fetch("http://localhost:5268/api/UpdateCategoryDescription", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            CategoryName: newName || oldName, // Use new name if it was changed
            NewDescription: description.trim(),
          }),
        });

        if (!descRes.ok) {
          const data = await descRes.json();
          setError(data?.message || "Failed to update description.");
          // Even if description update fails, name update succeeded
          await fetchCategories();
          return false;
        }
      }

      // If we got here, everything succeeded
      setError("");
      showMessage("Category updated successfully!");
      await fetchCategories();
      setEditStates((prev) => ({ ...prev, [oldName]: false }));
      setEditInputs({});
      return true;

    } catch (err) {
      setError("An error occurred while updating the category.");
      // Refresh to show current state
      await fetchCategories();
      return false;
    }
  };

  // Add showMessage function if it doesn't exist
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return <div style={{ color: "#fff", textAlign: "center", padding: "50px", fontSize: "1.5rem" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#26292B", minHeight: "100vh", color: "#fff" }}>
      <button
        onClick={() => window.location.href = "/admin"}
        style={{ marginBottom: "18px", padding: "10px 24px", fontSize: "1.1rem", borderRadius: "5px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
      >
        Back to Main Menu
      </button>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "24px" }}>Category Management</h2>
      {message && <p style={{ color: "#28a745", fontSize: "1.2rem", marginBottom: "10px" }}>{message}</p>}
      {error && <p style={{ color: "red", fontSize: "1.2rem", marginBottom: "10px" }}>{error}</p>}
      <form onSubmit={handleCreate} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px" }}>
        <h3 style={{ fontSize: "1.3rem", marginRight: "18px" }}>Create New Category</h3>
        <input
          type="text"
          placeholder="Category Name"
          value={newCategory.categoryName}
          onChange={(e) => setNewCategory({ ...newCategory, categoryName: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <input
          type="text"
          placeholder="Description"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <button type="submit" style={{ fontSize: "1.1rem", padding: "10px 28px", borderRadius: "5px", background: "#007bff", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>Create</button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Category Name</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Description</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.filter(cat => cat.categoryName && cat.categoryName.trim() !== "").map((cat) => {
            const isEditing = editStates[cat.categoryName];
            const editInput = editInputs[cat.categoryName] || { categoryName: cat.categoryName, description: cat.description };
            return (
              <tr key={cat.id}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>{cat.id}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInput.categoryName}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [cat.categoryName]: { ...prev[cat.categoryName], categoryName: e.target.value }
                      }))}
                      style={{ width: "160px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "120px" }}>{cat.categoryName}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInput.description}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [cat.categoryName]: { ...prev[cat.categoryName], description: e.target.value }
                      }))}
                      style={{ width: "200px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "120px" }}>{cat.description}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  <button
                    onClick={() => window.location.href = `/categories/${encodeURIComponent(cat.categoryName)}`}
                    style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#007bff", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                  >
                    View Products
                  </button>
                  {isEditing ? (
                    <>
                      <button
                        onClick={async () => {
                          const success = await handleCategoryNameChange(
                            cat.categoryName,
                            editInputs[cat.categoryName]?.categoryName || cat.categoryName,
                            editInputs[cat.categoryName]?.description || cat.description
                          );
                        }}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditStates(prev => ({ ...prev, [cat.categoryName]: false }));
                          setEditInputs(prev => {
                            const newInputs = { ...prev };
                            delete newInputs[cat.categoryName];
                            return newInputs;
                          });
                          setError("");
                        }}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditToggle(cat.categoryName)}
                      style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#ffc107", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}
                    >
                      Edit
                    </button>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => handleDelete(cat.categoryName)}
                      style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                    >
                      Delete
                    </button>
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

export default CategortyManagementPage;
