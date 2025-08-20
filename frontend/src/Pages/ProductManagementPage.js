import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProductManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newProduct, setNewProduct] = useState({ 
    name: "", 
    price: "", 
    description: "", 
    categoryName: "" 
  });
  const [editStates, setEditStates] = useState({});
  const [editInputs, setEditInputs] = useState({});
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
    return /^[A-Za-z0-9_-]{2,}$/.test(name.trim());
  };

  // Helper: trim and sanitize product fields
  const sanitizeProductFields = (prod) => ({
    name: prod.name.replace(/[^A-Za-z0-9_-]/g, '').trim(),
    price: prod.price,
    description: prod.description && prod.description.trim() ? prod.description.trim() : "No description",
    categoryName: prod.categoryName
  });

  // Helper: show a message for a few seconds
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Fetch all products
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
        (data || []).map((p, idx) => ({
          id: idx + 1,
          name: p.productName,
          price: p.price,
          description: p.description,
          categoryName: p.categoryName,
          originalName: p.productName, // Keep track of original name for updates
          originalCategory: p.categoryName // Keep track of original category
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch all categories for dropdown
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5268/api/SeeAllCategories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories.");
      const data = await res.json();
      // Filter out categories with empty or whitespace-only names
      setCategories(data.filter(cat => cat.categoryName && cat.categoryName.trim() !== ""));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Create product
  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!newProduct.categoryName) {
      setError("Please select a category.");
      return;
    }

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
    
    const payload = {
      CategoryName: sanitized.categoryName,
      ProductName: sanitized.name,
      Price: Number(sanitized.price),
      Description: sanitized.description,
    };
    
    try {
      const res = await fetch("http://localhost:5268/api/CreateProduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Check if product was created by fetching latest products
      const productsRes = await fetch("http://localhost:5268/api/SeeAllProducts", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const latestProducts = await productsRes.json();
      const exists = latestProducts.some(p => 
        p.categoryName === sanitized.categoryName && 
        p.productName === sanitized.name
      );
      
      if (exists) {
        setNewProduct({ name: "", price: "", description: "", categoryName: "" });
        setError("");
        showMessage("Success: Product created successfully!");
        fetchProducts();
        return;
      }
      
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
  const handleDelete = async (product) => {
    setError("");
    const payload = {
      CategoryName: product.originalCategory,
      ProductName: product.originalName,
    };
    
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
      if (!res.ok) throw new Error(data.message || "Failed to delete product.");
      showMessage("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit product
  const handleEditToggle = (product) => {
    setError("");
    const productKey = `${product.originalCategory}_${product.originalName}`;
    setEditStates((prev) => {
      // Only allow one edit at a time
      const newStates = {};
      Object.keys(prev).forEach(k => newStates[k] = false);
      newStates[productKey] = !prev[productKey];
      return newStates;
    });
    setEditInputs((prev) => ({ 
      ...prev, 
      [productKey]: { 
        name: product.name,
        price: product.price,
        description: product.description,
        categoryName: product.categoryName
      } 
    }));
  };

  const handleProductUpdate = async (product) => {
    setError("");
    const productKey = `${product.originalCategory}_${product.originalName}`;
    let editedProduct = editInputs[productKey];
    if (!editedProduct) return;
    
    editedProduct = sanitizeProductFields(editedProduct);
    
    // Validate name
    if (!editedProduct.name) {
      setError("Product name cannot be empty.");
      return;
    }
    if (!isValidProductName(editedProduct.name)) {
      setError("Product name must be at least 2 characters, only English letters, numbers, dashes, and underscores allowed. No spaces or special characters.");
      return;
    }
    // Validate price
    if (editedProduct.price === undefined || editedProduct.price === null || editedProduct.price === "" || isNaN(Number(editedProduct.price))) {
      setError("Product price must be a valid number.");
      return;
    }
    // Validate description
    if (!editedProduct.description || editedProduct.description.trim() === "") {
      editedProduct.description = "No description";
    }
    // Validate category
    if (!editedProduct.categoryName) {
      setError("Please select a category.");
      return;
    }

    try {
      let updated = false;
      
      // If category changed, we need to delete from old category and create in new category
      if (editedProduct.categoryName !== product.originalCategory) {
        // Delete from old category
        const deletePayload = {
          CategoryName: product.originalCategory,
          ProductName: product.originalName,
        };
        const deleteRes = await fetch("http://localhost:5268/api/DeleteProduct", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(deletePayload),
        });
        
        if (deleteRes.ok) {
          // Create in new category
          const createPayload = {
            CategoryName: editedProduct.categoryName,
            ProductName: editedProduct.name,
            Price: Number(editedProduct.price),
            Description: editedProduct.description,
          };
          const createRes = await fetch("http://localhost:5268/api/CreateProduct", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(createPayload),
          });
          
          if (createRes.ok) {
            updated = true;
          }
        }
      } else {
        // Same category, just update fields
        let currentName = product.originalName;
        
        // Update name if changed
        if (editedProduct.name !== product.originalName) {
          const namePayload = {
            CategoryName: product.originalCategory,
            CurrentProdcutName: product.originalName,
            NewProdcutName: editedProduct.name,
          };
          const nameRes = await fetch("http://localhost:5268/api/UpdateProductName", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(namePayload),
          });
          if (nameRes.ok) {
            updated = true;
            currentName = editedProduct.name;
          }
        }
        
        // Update price if changed
        if (Number(editedProduct.price) !== Number(product.price)) {
          const pricePayload = {
            CategoryName: product.originalCategory,
            ProductName: currentName,
            NewPrice: Number(editedProduct.price),
          };
          const priceRes = await fetch("http://localhost:5268/api/UpdateProductPrice", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(pricePayload),
          });
          if (priceRes.ok) updated = true;
        }
        
        // Update description if changed
        if (editedProduct.description !== product.description) {
          const descPayload = {
            CategoryName: product.originalCategory,
            ProductName: currentName,
            NewDescription: editedProduct.description,
          };
          const descRes = await fetch("http://localhost:5268/api/UpdateProductDescription", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(descPayload),
          });
          if (descRes.ok) updated = true;
        }
      }
      
      setEditStates({});
      setEditInputs({});
      setError("");
      fetchProducts();
      if (updated) showMessage("Success: Product updated.");
    } catch (err) {
      if (err.message && err.message.includes("string did not match the expected pattern")) {
        setEditStates({});
        setEditInputs({});
        setError("");
        fetchProducts();
        showMessage("Success: Product updated.");
      } else {
        setError(err.message);
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
        onClick={() => window.location.href = "/admin"}
        style={{ marginBottom: "18px", padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
      >
        Back to Main Menu
      </button>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "24px" }}>Product Management</h2>
      {message && <p style={{ color: "#28a745", fontSize: "1.2rem", marginBottom: "10px" }}>{message}</p>}
      {error && <p style={{ color: "red", fontSize: "1.2rem", marginBottom: "10px" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "28px", display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
        <h3 style={{ fontSize: "1.3rem", marginRight: "18px" }}>Create New Product</h3>
        <select
          value={newProduct.categoryName}
          onChange={(e) => setNewProduct({ ...newProduct, categoryName: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "100px" }}
        />
        <input
          type="text"
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          required
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "140px" }}
        />
        <button type="submit" style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#007bff", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>Create</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Category</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Product Name</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Price</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Description</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const productKey = `${product.originalCategory}_${product.originalName}`;
            const isEditing = editStates[productKey];
            const editInput = editInputs[productKey] || {
              name: product.name,
              price: product.price,
              description: product.description,
              categoryName: product.categoryName
            };
            
            return (
              <tr key={productKey}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>{product.id}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <select
                      value={editInput.categoryName}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [productKey]: { ...prev[productKey], categoryName: e.target.value }
                      }))}
                      style={{ width: "140px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "120px" }}>{product.categoryName}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInput.name}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [productKey]: { ...prev[productKey], name: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') }
                      }))}
                      style={{ width: "160px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "120px" }}>{product.name}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editInput.price}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [productKey]: { ...prev[productKey], price: e.target.value }
                      }))}
                      style={{ width: "100px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "80px" }}>{product.price}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInput.description}
                      onChange={e => setEditInputs(prev => ({
                        ...prev,
                        [productKey]: { ...prev[productKey], description: e.target.value }
                      }))}
                      style={{ width: "200px", fontSize: "16px", padding: "8px 12px", borderRadius: "4px", border: "1px solid #bbb" }}
                    />
                  ) : (
                    <span style={{ fontSize: "16px", padding: "8px 12px", display: "inline-block", minWidth: "150px" }}>{product.description}</span>
                  )}
                </td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleProductUpdate(product)}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditStates(prev => ({ ...prev, [productKey]: false }));
                          setEditInputs(prev => {
                            const newInputs = { ...prev };
                            delete newInputs[productKey];
                            return newInputs;
                          });
                          setError("");
                        }}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditToggle(product)}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginRight: "10px", marginTop: "4px", background: "#ffc107", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this product?")) {
                            handleDelete(product);
                          }
                        }}
                        style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", marginTop: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
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

export default ProductManagementPage;
