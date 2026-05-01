import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import logoImage from "../assets/img.png";
import { handleError, handleSuccess } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      return handleError("Please fill all fields");
    }

    if (form.newPassword.length < 6) {
      return handleError("Password must be at least 6 characters");
    }

    if (form.newPassword !== form.confirmPassword) {
      return handleError("Passwords do not match");
    }

    if (!token) {
      return handleError("Reset token is missing");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/reset-password/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: form.newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Password reset failed");
      }

      handleSuccess(data.message);
      navigate("/login");
    } catch (error) {
      handleError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="auth-brand-card">
          <img src={logoImage} alt="Recipe Nest Logo" className="auth-brand-logo" />
          <h1 className="auth-brand-title">Recipe Nest</h1>
          <p className="auth-brand-subtitle">Set your new password</p>
          <p className="auth-brand-tagline">Fresh start, same account</p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="auth-feature-icon">✅</span>
            <div>
              <h3>One-time Reset</h3>
              <p>Use the token before it expires</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Reset Password</h2>
          <p className="auth-form-subtitle">Create a new password for your account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
            />

            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <div className="auth-inline-row">
              <span>Show password</span>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>

          <p className="auth-bottom-text">
            Back to <Link to="/login">Login</Link>
          </p>

          <Link to="/landing" className="auth-back-link">← Back to Home</Link>
        </div>
      </section>
    </div>
  );
};

export default ResetPasswordPage;
