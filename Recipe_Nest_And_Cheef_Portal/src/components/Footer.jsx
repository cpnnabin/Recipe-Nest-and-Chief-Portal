import { useNavigate, useLocation } from "react-router-dom";
import logoImage from "../assets/img.png";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <footer className="site-footer">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <div className="site-footer-brand-head">
              <img src={logoImage} alt="Recipe Nest" className="site-footer-logo" />
              <div>
                <h3>Recipe Nest</h3>
                <p>परिकारमा संस्कृति, स्वादमा पहिचान।</p>
              </div>
            </div>
            <p className="site-footer-desc">
              Your ultimate destination for authentic Nepali cuisine and recipes.
            </p>
          </div>

          <div>
            <h4 className="site-footer-title">Quick Links</h4>
            <div className="site-footer-links">
              <button type="button" onClick={() => navigate("/recipes")}>Browse Recipes</button>
              <button type="button" onClick={() => navigate("/add-recipe")}>Add Recipe</button>
              <button type="button" onClick={() => navigate("/profile")}>My Profile</button>
            </div>
          </div>

          <div>
            <h4 className="site-footer-title">Categories</h4>
            <div className="site-footer-links site-footer-links-text">
              <span>Breakfast</span>
              <span>Main Dishes</span>
              <span>Curry</span>
              <span>Desserts</span>
            </div>
          </div>

          <div>
            <h4 className="site-footer-title">Follow Us</h4>
            <div className="site-footer-socials" aria-label="Social links">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">◎</a>
              <a href="#" aria-label="YouTube">▶</a>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© 2026 Recipe Nest. All rights reserved.</span>
          <div>
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
            <button type="button">Contact Us</button>
          </div>
        </div>
      </footer>

      <nav className="footer-nav">
        {/* Home */}
        <button
          className={`footer-btn ${isActive("/home") ? "active" : ""}`}
          onClick={() => navigate("/home")}
        >
          <svg viewBox="0 0 24 24" fill={isActive("/home") ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
          <span className="footer-btn-label">Home</span>
          {isActive("/home") && <span className="footer-dot" />}
        </button>

        {/* Recipes list / explore */}
        <button
          className={`footer-btn ${isActive("/recipes") ? "active" : ""}`}
          onClick={() => navigate("/recipes")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <span className="footer-btn-label">Recipes</span>
          {isActive("/recipes") && <span className="footer-dot" />}
        </button>

        {/* Add Recipe — center prominent button */}
        <button
          className="footer-add-btn"
          onClick={() => navigate("/add-recipe")}
          title="Add New Recipe"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Saved */}
        <button
          className={`footer-btn ${isActive("/saved") ? "active" : ""}`}
          onClick={() => navigate("/saved")}
        >
          <svg viewBox="0 0 24 24" fill={isActive("/saved") ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
          <span className="footer-btn-label">Saved</span>
          {isActive("/saved") && <span className="footer-dot" />}
        </button>

        {/* Profile */}
        <button
          className={`footer-btn ${isActive("/profile") ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          <svg viewBox="0 0 24 24" fill={isActive("/profile") ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span className="footer-btn-label">Profile</span>
          {isActive("/profile") && <span className="footer-dot" />}
        </button>
      </nav>
    </>
  );
};

export default Footer;