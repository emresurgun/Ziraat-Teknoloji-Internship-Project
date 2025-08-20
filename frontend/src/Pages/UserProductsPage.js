import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function UserProductsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  // Check authentication (any logged-in user can access)
  useEffect(() => {
    if (!token) {
      // If no token, redirect to login page
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const username = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      
      setUser({ username, role });
      setLoading(false);
    } catch (err) {
      alert("Token is invalid or expired.");
      navigate("/login");
    }
  }, [navigate, token]);

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
        }))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch all categories for filtering
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
    if (!loading) {
      fetchProducts();
      fetchCategories();
    }
  }, [loading]);

  // Filter products by selected category
  const filteredProducts = selectedCategory 
    ? products.filter(product => product.categoryName === selectedCategory)
    : products;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
      {/* Header with user info and logout */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", margin: "0", color: "#fff" }}>Product Catalog</h1>
          <p style={{ margin: "5px 0", color: "#ccc", fontSize: "1.1rem" }}>
            Welcome, {user?.username} ({user?.role})
          </p>
        </div>
        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          <button
            onClick={() => navigate("/user/settings")}
            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#28a745", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            User Settings
          </button>
          {user?.role === "Admin" && (
            <button
              onClick={() => navigate("/admin")}
              style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#17a2b8", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
            >
              Admin Panel
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{ padding: "10px 24px", fontSize: "16px", borderRadius: "4px", background: "#dc3545", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red", fontSize: "1.2rem", marginBottom: "20px" }}>{error}</p>}

      {/* Category Filter */}
      <div style={{ marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
        <h3 style={{ fontSize: "1.3rem", margin: "0", color: "#fff" }}>Filter by Category:</h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ fontSize: "1.1rem", padding: "10px 18px", borderRadius: "5px", border: "1px solid #bbb", minWidth: "200px", backgroundColor: "#fff" }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.categoryName}>{cat.categoryName}</option>
          ))}
        </select>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory("")}
            style={{ padding: "8px 16px", fontSize: "14px", borderRadius: "4px", background: "#6c757d", color: "#fff", border: "none", cursor: "pointer" }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Products Count */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "1.1rem", color: "#ccc", margin: "0" }}>
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          {selectedCategory && ` in "${selectedCategory}"`}
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#ccc" }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>No products found</h3>
          <p style={{ fontSize: "1.1rem" }}>
            {selectedCategory 
              ? `No products available in "${selectedCategory}" category.`
              : "No products available at the moment."
            }
          </p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "25px",
          marginTop: "20px"
        }}>
          {filteredProducts.map((product) => (
            <div
              key={`${product.categoryName}_${product.name}`}
              style={{
                backgroundColor: "#fff",
                padding: "25px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                color: "#333",
                border: "1px solid #ddd",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
              }}
            >
              {/* Product Header */}
              <div style={{ marginBottom: "15px" }}>
                <h3 style={{ 
                  fontSize: "1.4rem", 
                  margin: "0 0 8px 0", 
                  color: "#2c3e50",
                  fontWeight: "600"
                }}>
                  {product.name}
                </h3>
                <span style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}>
                  {product.categoryName}
                </span>
              </div>

              {/* Product Description */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ 
                  fontSize: "1rem", 
                  lineHeight: "1.5", 
                  color: "#666", 
                  margin: "0",
                  minHeight: "48px"
                }}>
                  {product.description}
                </p>
              </div>

              {/* Product Price */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                borderTop: "1px solid #eee",
                paddingTop: "15px"
              }}>
                <span style={{ 
                  fontSize: "1.5rem", 
                  fontWeight: "700", 
                  color: "#28a745" 
                }}>
                  ${product.price}
                </span>
                <span style={{ 
                  fontSize: "0.9rem", 
                  color: "#999",
                  fontStyle: "italic"
                }}>
                  Product #{product.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Overview */}
      <div style={{ marginTop: "50px", borderTop: "2px solid #444", paddingTop: "30px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "20px", color: "#fff" }}>Available Categories</h2>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
          gap: "15px" 
        }}>
          {categories.map((category) => {
            const categoryProductCount = products.filter(p => p.categoryName === category.categoryName).length;
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.categoryName)}
                style={{
                  backgroundColor: selectedCategory === category.categoryName ? "#007bff" : "#444",
                  padding: "20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  border: "2px solid transparent"
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category.categoryName) {
                    e.currentTarget.style.backgroundColor = "#555";
                    e.currentTarget.style.borderColor = "#007bff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category.categoryName) {
                    e.currentTarget.style.backgroundColor = "#444";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                <h4 style={{ 
                  fontSize: "1.2rem", 
                  margin: "0 0 8px 0", 
                  color: "#fff",
                  fontWeight: "600"
                }}>
                  {category.categoryName}
                </h4>
                <p style={{ 
                  fontSize: "0.95rem", 
                  color: "#ccc", 
                  margin: "0 0 8px 0",
                  lineHeight: "1.4"
                }}>
                  {category.description}
                </p>
                <span style={{ 
                  fontSize: "0.9rem", 
                  color: selectedCategory === category.categoryName ? "#fff" : "#007bff",
                  fontWeight: "500"
                }}>
                  {categoryProductCount} product{categoryProductCount !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UserProductsPage;
