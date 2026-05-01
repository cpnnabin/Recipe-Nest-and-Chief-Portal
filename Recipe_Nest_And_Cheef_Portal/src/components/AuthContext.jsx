// src/context/AuthContext.jsx
import { useState } from "react";
import { jwtDecode } from "jwt-decode";   
import AuthContext from "../services/auth-context";

export const AuthProvider = ({ children }) => {
  const parseUserFromToken = (token) => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.id,
        role: decoded.role || "user",
        name: decoded.name,
        email: decoded.email,
      };
    } catch {
      localStorage.removeItem("token");
      return null;
    }
  };

  const [user, setUser] = useState(() => parseUserFromToken(localStorage.getItem("token")));
  const loading = false;

  const login = (token) => {
    localStorage.setItem("token", token);
    setUser(parseUserFromToken(token));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};