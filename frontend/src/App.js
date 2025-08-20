import UserManagmentPage from "./Pages/UserManagmentPage";
import CategortyManagementPage from "./Pages/CategortyManagementPage";
import ProductManagementPage from "./Pages/ProductManagementPage";
import UserProductsPage from "./Pages/UserProductsPage";
import UserSettingsPage from "./Pages/UserSettingsPage";
import HomePage from "./Pages/HomePage";
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import AdminPage from "./Pages/AdminPage";
import CategoryProductsPage from "./Pages/CategoryProductsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users" element={<UserManagmentPage />} />
        <Route path="/admin/categories" element={<CategortyManagementPage />} />
        <Route path="/admin/products" element={<ProductManagementPage />} />
        <Route path="/categories" element={<CategortyManagementPage />} />
        <Route path="/categories/:categoryName" element={<CategoryProductsPage />} />
        <Route path="/products" element={<ProductManagementPage />} />
        <Route path="/user/products" element={<UserProductsPage />} />
        <Route path="/user/settings" element={<UserSettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;