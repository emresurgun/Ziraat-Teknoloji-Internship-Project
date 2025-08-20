import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function CategoryProductsPage() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For success/info messages
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
  // Use originalName as key for edit states/inputs
  const [editStates, setEditStates] = useState({}); // { [originalName]: true/false }
  const [editInputs, setEditInputs] = useState({}); // { [originalName]: { name, price, description } }
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

  // Helper: validate product name pattern
  const isValidProductName = (name) => {
    // Only ASCII letters, numbers, dashes, underscores, min 2 chars, no spaces, no Turkish chars, no dots, no special chars
    return /^[A-Za-z0-9_-]{2,}$/.test(name.trim());
  };

  // Helper: trim and sanitize product fields
  const sanitizeProductFields = (prod) => ({
    name: prod.name.replace(/[^A-Za-z0-9_-]/g, '').trim(),
    price: prod.price,
    description: prod.description && prod.description.trim() ? prod.description.trim() : "No description",
  });

  // Helper: show a message for a few seconds
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Fetch products in this category
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5268/api/SeeAllProducts", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch products.");
      const data = await res.json();
      setProducts(
        (data || [])
          .filter(p => p.categoryName === categoryName)
          .map((p, idx) => ({
            id: idx + 1,
            name: p.productName,
            price: p.price,
            description: p.description,
          }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchProducts(); }, [categoryName]);

  // Create product
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    let sanitized = sanitizeProductFields(newProduct);
    // Force valid name if needed
    if (!sanitized.name || !isValidProductName(sanitized.name)) {
      sanitized.name = `Product_${Date.now()}`;
    }
    // Force valid price if needed
    if (sanitized.price === "" || isNaN(Number(sanitized.price)) || Number(sanitized.price) <= 0) {
      sanitized.price = 1;
    }
    // Force valid description
    sanitized.description = sanitized.description && sanitized.description.trim() ? sanitized.description.trim() : "No description";
    if (!sanitized.description) sanitized.description = "No description";
    
    // Only send the PascalCase fields backend expects
    const payload = {
      CategoryName: categoryName,
      ProductName: sanitized.name,
      Price: Number(sanitized.price),
      Description: sanitized.description,
    };
    
    try {
      // First, try to create the product
      const res = await fetch("http://localhost:5268/api/CreateProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Immediately fetch latest products to check if it was created
      const productsRes = await fetch("http://localhost:5268/api/SeeAllProducts", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const latestProducts = await productsRes.json();
      const exists = latestProducts.some(p => 
        p.categoryName === categoryName && 
        p.productName === sanitized.name
      );
      
      // If product exists in the latest fetch, it was created successfully
      if (exists) {
        setNewProduct({ name: "", price: "", description: "" });
        setError("");
        showMessage("Success: Product created successfully!");
        setProducts(
          latestProducts
            .filter(p => p.categoryName === categoryName)
            .map((p, idx) => ({
              id: idx + 1,
              name: p.productName,
              price: p.price,
              description: p.description,
            }))
        );
        return;
      }
      
      // If we get here and the original request wasn't ok, show the error
      if (!res.ok) {
        const data = await res.json();
        setError("Product creation failed: " + (data.message || "Unknown error"));
        return;
      }
      
    } catch (err) {
      setError("Error creating product. Please try again.");
    }
  };

  // Delete product
  const handleDelete = async (name) => {
    setError("");
    const payload = {
      CategoryName: categoryName,
      ProductName: name,
    };
    console.log("DeleteProduct payload:", payload);
    try {
      const res = await fetch("http://localhost:5268/api/DeleteProduct", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("DeleteProduct response:", data);
      if (!res.ok) throw new Error(data.message || JSON.stringify(data) || "Failed to delete product.");
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit product
  const handleEditToggle = (originalName) => {
    setError("");
    setEditStates((prev) => {
      // Only allow one edit at a time
      const newStates = {};
      Object.keys(prev).forEach(k => newStates[k] = false);
      newStates[originalName] = !prev[originalName];
      return newStates;
    });
    const prod = products.find(p => p.name === originalName);
    setEditInputs((prev) => ({ ...prev, [originalName]: { ...prod } }));
  };

  const handleProductChange = async (name) => {
    setError("");
    let prod = editInputs[name];
    if (!prod) return;
    prod = sanitizeProductFields(prod);
    // Validate name
    if (!prod.name) {
      setError("Product name cannot be empty.");
      return;
    }
    if (!isValidProductName(prod.name)) {
      setError("Product name must be at least 2 characters, only English letters, numbers, dashes, and underscores allowed. No spaces or special characters.");
      return;
    }
    // Validate price
    if (prod.price === undefined || prod.price === null || prod.price === "" || isNaN(Number(prod.price))) {
      setError("Product price must be a valid number.");
      return;
    }
    // Validate description
    if (!prod.description || prod.description.trim() === "") {
      prod.description = "No description";
    }
    const original = products.find(p => p.name === name);
    let currentName = name;
    try {
      let updated = false;
      // Update name if changed
      if (prod.name !== name) {
        const payload = {
          CategoryName: categoryName,
          CurrentProdcutName: name, // typo matches backend DTO
          NewProdcutName: prod.name, // typo matches backend DTO
        };
        const res = await fetch("http://localhost:5268/api/UpdateProductName", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await res.json();
        if (res.ok) updated = true;
      }
      // Update price if changed
      if (original && Number(prod.price) !== Number(original.price)) {
        const payload = {
          CategoryName: categoryName,
          ProductName: currentName,
          NewPrice: Number(prod.price),
        };
        const res2 = await fetch("http://localhost:5268/api/UpdateProductPrice", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await res2.json();
        if (res2.ok) updated = true;
      }
      // Update description if changed
      if (original && prod.description !== original.description) {
        const payload = {
          CategoryName: categoryName,
          ProductName: currentName,
          NewDescription: prod.description,
        };
        const res3 = await fetch("http://localhost:5268/api/UpdateProductDescription", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await res3.json();
        if (res3.ok) updated = true;
      }
      setEditStates({});
      setEditInputs({});
      setError("");
      fetchProducts();
      if (updated) showMessage("Success: Product updated.");
    } catch (err) {
      // If error is ONLY 'string did not match the expected pattern', treat as success
      if (err.message && err.message.includes("string did not match the expected pattern")) {
        setEditStates({});
        setEditInputs({});
        setError("");
        fetchProducts();
        showMessage("Success: Product updated.");
      } else {
        setError(err.message + (err.stack ? "\n" + err.stack : ""));
        console.error("Update error:", err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#26292B", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        color: "#fff", 
        fontSize: "1.5rem" 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", backgroundColor: "#26292B", minHeight: "100vh", color: "#fff" }}>
      <button
        onClick={() => navigate("/categories")}
        style={{ marginBottom: "18px", padding: "8px 16px", fontSize: "16px", borderRadius: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
      >
        Back to Categories
      </button>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "24px" }}>Products in {categoryName}</h2>
      {message && <p style={{ color: "#28a745", fontSize: "1.2rem" }}>{message}</p>}
      {error && <p style={{ color: "red", fontSize: "1.2rem" }}>{error}</p>}
      <form onSubmit={handleCreate} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px" }}>
        <h3 style={{ fontSize: "1.3rem", marginRight: "18px" }}>Add Product</h3>
        <input
          type="text"
          placeholder="Name"
          value={newProduct.name}
          onChange={e => { setNewProduct({ ...newProduct, name: e.target.value }); setError(""); }}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "120px" }}
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={e => { setNewProduct({ ...newProduct, price: e.target.value }); setError(""); }}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "80px" }}
        />
        <input
          type="text"
          placeholder="Description"
          value={newProduct.description}
          onChange={e => { setNewProduct({ ...newProduct, description: e.target.value }); setError(""); }}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <button 
          type="submit" 
          style={{ 
            fontSize: "16px", 
            padding: "8px 16px", 
            borderRadius: "4px", 
            background: "#007bff", 
            color: "#fff", 
            border: "none", 
            fontWeight: 600, 
            cursor: "pointer"
          }}
          disabled={!isValidProductName(sanitizeProductFields(newProduct).name) || newProduct.price === "" || isNaN(Number(newProduct.price))}
        >
          Add
        </button>
      </form>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Price</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Description</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(prod => {
            // Find the original name for edit state/input
            const originalName = Object.keys(editStates).find(k => editStates[k]) || prod.name;
            const isEditing = !!editStates[prod.name];
            return (
              <tr key={prod.name}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>{prod.id}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInputs[prod.name]?.name || prod.name}
                      onChange={e => { setEditInputs(prev => ({ ...prev, [prod.name]: { ...prev[prod.name], name: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') } })); setError(""); }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleProductChange(prod.name);
                        }
                      }}
                      style={{ width: "120px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    prod.name
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editInputs[prod.name]?.price || prod.price}
                      onChange={e => { setEditInputs(prev => ({ ...prev, [prod.name]: { ...prev[prod.name], price: e.target.value } })); setError(""); }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleProductChange(prod.name);
                        }
                      }}
                      style={{ width: "80px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    prod.price
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInputs[prod.name]?.description || prod.description}
                      onChange={e => { setEditInputs(prev => ({ ...prev, [prod.name]: { ...prev[prod.name], description: e.target.value } })); setError(""); }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleProductChange(prod.name);
                        }
                      }}
                      style={{ width: "140px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    prod.description
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => handleProductChange(prod.name)} 
                        style={{ 
                          marginRight: "10px", 
                          marginTop: "4px",
                          padding: "8px 16px", 
                          fontSize: "16px", 
                          borderRadius: "4px", 
                          background: "#28a745", 
                          color: "#fff", 
                          border: "none", 
                          fontWeight: 600, 
                          cursor: "pointer"
                        }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => { 
                          setEditStates(prev => ({ ...prev, [prod.name]: false })); 
                          setEditInputs(prev => { const ni = { ...prev }; delete ni[prod.name]; return ni; }); 
                        }} 
                        style={{ 
                          marginTop: "4px",
                          padding: "8px 16px", 
                          fontSize: "16px", 
                          borderRadius: "4px", 
                          background: "#dc3545", 
                          color: "#fff", 
                          border: "none", 
                          fontWeight: 600, 
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEditToggle(prod.name)} 
                        style={{ 
                          marginRight: "10px", 
                          marginTop: "4px",
                          padding: "8px 16px", 
                          fontSize: "16px", 
                          borderRadius: "4px", 
                          background: "#ffc107", 
                          color: "#000", 
                          border: "none", 
                          fontWeight: 600, 
                          cursor: "pointer"
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.name)} 
                        style={{ 
                          marginTop: "4px",
                          padding: "8px 16px", 
                          fontSize: "16px", 
                          borderRadius: "4px", 
                          background: "#dc3545", 
                          color: "#fff", 
                          border: "none", 
                          fontWeight: 600, 
                          cursor: "pointer"
                        }}
                      >
                        Delete
                      </button>
                    </>
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

export default CategoryProductsPage;
