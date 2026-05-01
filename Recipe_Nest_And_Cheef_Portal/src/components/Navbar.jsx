import { Link, useLocation, useNavigate } from "react-router-dom";
import logoImage from "../assets/img.png";

const Navbar = ({ portalName }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole") || "customer";
  const canManageRecipes = currentRole === "admin" || currentRole === "chief";
  const dashboardPath = currentRole === "user" ? "/client-home" : "/home";
  const navItems = [
    { label: "Dashboard", path: dashboardPath },
    { label: "Recipes", path: "/recipes" },
    { label: "Profile", path: "/profile" },
  ];

  if (canManageRecipes) {
    navItems.splice(2, 0, { label: "Add Recipe", path: "/add-recipe" });
  }

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const brandLabel = portalName || "Recipe Nest";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to={dashboardPath} className="app-header-brand">
          <img src={logoImage} alt="Recipe Nest" className="app-header-logo" />
          <div className="app-header-brand-text">
            <strong>{brandLabel}</strong>
            <span>परिकारमा संस्कृति, स्वादमा पहिचान</span>
          </div>
        </Link>

        <nav className="app-header-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`app-header-link ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button type="button" className="app-header-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
