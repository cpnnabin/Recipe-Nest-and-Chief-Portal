import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "../assets/img.png";
import { handleError, handleSuccess } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resetToken, setResetToken] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      return handleError("Email is required");
    }

    setLoading(true);
    setMessage("");
    setResetToken("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to request password reset");
      }

      const token = data?.data?.resetToken || "";
      const resetUrl = data?.data?.resetUrl || (token ? `/reset-password/${token}` : "");

      setResetToken(token);
      setMessage(
        `${data.message} ${token ? "Use the token below to set a new password." : ""}`
      );
      handleSuccess(data.message);

      if (resetUrl) {
        navigate(resetUrl, { replace: false });
      }
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
          <p className="auth-brand-subtitle">Reset your password safely</p>
          <p className="auth-brand-tagline">We’ll help you get back in</p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔐</span>
            <div>
              <h3>Secure Recovery</h3>
              <p>Generate a reset token for your account</p>
            </div>
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-icon">⏱️</span>
            <div>
              <h3>Short-lived Token</h3>
              <p>Tokens expire quickly for better protection</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Forgot Password</h2>
          <p className="auth-form-subtitle">Enter your email to get a reset token</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Token"}
            </button>
          </form>

          {message ? (
            <div style={{ marginTop: "18px", padding: "14px", borderRadius: "12px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              <p style={{ margin: 0 }}>{message}</p>
              {resetToken ? (
                <div style={{ marginTop: "10px" }}>
                  <strong>Reset token:</strong>
                  <div style={{ marginTop: "6px", wordBreak: "break-all", fontFamily: "monospace", background: "#fff", padding: "10px", borderRadius: "10px", border: "1px solid #dbeafe" }}>
                    {resetToken}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="auth-bottom-text">
            Remembered it? <Link to="/login">Back to Login</Link>
          </p>

          <Link to="/landing" className="auth-back-link">← Back to Home</Link>
        </div>
      </section>
    </div>
  );
};

export default ForgotPasswordPage;
