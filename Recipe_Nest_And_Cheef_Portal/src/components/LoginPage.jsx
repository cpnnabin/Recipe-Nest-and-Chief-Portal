import React from "react";
import { Link } from "react-router-dom";
import { handleError, handleSuccess } from "./utils";
import logoImage from "../assets/img.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Login = () => {
  const [loginInfo, setLoginInfo] = React.useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo({
      ...loginInfo,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("All fields are required");
    }

    try {
      const url = `${API_BASE}/api/users/login`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      });

      const data = await res.json();
      console.log("Login Response:", data);

      const { success, message, jwtToken, name, role, data: payload } = data;
      const loginUser = payload?.user || {};

      if (success && jwtToken) {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("loggedInUser");

        localStorage.setItem("jwtToken", jwtToken);
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({
            name: loginUser.name || name || "",
            username: loginUser.username || loginUser.name || name || "",
            email: loginUser.email || "",
            role: loginUser.role || role || "customer",
          })
        );
        localStorage.setItem("userRole", loginUser.role || role || "customer");

        handleSuccess(message);

        setTimeout(() => {
          if (role === "admin") {
            window.location.href = "/admin";
            return;
          }

          if (role === "chief") {
            window.location.href = "/admin";
            return;
          }

          if (role === "user") {
            window.location.href = "/client-home";
            return;
          }

          window.location.href = "/home";
        }, 400);
      } else {
        handleError(message || data.errors?.[0] || "Login failed");
      }
    } catch (err) {
      console.error(err);
      handleError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="auth-brand-card">
          <img src={logoImage} alt="Recipe Nest Logo" className="auth-brand-logo" />
          <h1 className="auth-brand-title">Recipe Nest</h1>
          <p className="auth-brand-subtitle">Nepali Khana ko Sansar</p>
          <p className="auth-brand-tagline">(Nepali Food World)</p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔎</span>
            <div>
              <h3>Discover Recipes</h3>
              <p>Momo dekhi Dal Bhat samma sabai</p>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔗</span>
            <div>
              <h3>Share Recipes</h3>
              <p>Aafno recipe share garnus</p>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="auth-feature-icon">👥</span>
            <div>
              <h3>Join Community</h3>
              <p>Nepali food lovers sanga judnu</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Welcome Back!</h2>
          <p className="auth-form-subtitle">Login to continue your cooking journey</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              onChange={handleChange}
              type="email"
              name="email"
              id="email"
              placeholder="your.email@example.com"
              value={loginInfo.email}
            />

            <label htmlFor="password">Password</label>
            <input
              onChange={handleChange}
              type="password"
              name="password"
              id="password"
              placeholder="Enter your password"
              value={loginInfo.password}
            />

            <div className="auth-inline-row">
              <span>Remember me</span>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-primary-btn">Login</button>
          </form>

          <p className="auth-bottom-text">
            Don't have an account? <Link to="/signup">Register Now</Link>
          </p>

          <Link to="/landing" className="auth-back-link">← Back to Home</Link>
        </div>
      </section>
    </div>
  );
};

export default Login;