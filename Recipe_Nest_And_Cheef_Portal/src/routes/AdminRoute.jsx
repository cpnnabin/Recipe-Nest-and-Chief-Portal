// src/components/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../services/useAuth";

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", padding: "50px", color: "#E8531C" }}>Loading...</div>;
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin → go to home or unauthorized
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Admin → allow all admin pages
  return <Outlet />;
};

export default AdminRoute;