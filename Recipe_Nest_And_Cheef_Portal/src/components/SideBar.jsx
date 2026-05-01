import { NavLink, useNavigate } from "react-router-dom";
import logoImage from "../assets/img.png";

const NAV_ITEMS = [
  {
    label: "Home",
    path: "/home",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6m5 0h-14a2 2 0 01-2-2V7a2 2 0 012-2h3.17a2 2 0 001.41-.59l1.83-1.83a2 2 0 012.83 0l1.83 1.83A2 2 0 0016.83 5H20a2 2 0 012 2v11a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Dashboard",
    path: "/admin",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Recipe Library",
    path: "/admin/recipes",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Recipe Add",
    path: "/admin/add-recipe",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    label: "Comments",
    path: "/admin/comments",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: (
      <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const ADMIN_PROFILE = {
  name: "Chief Admin",
  email: "admin@recipenest.com",
};

export default function Sidebar({ showUserInfo = true }) {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("loggedInUser");

  let parsedUser = null;
  let legacyUserName = "";
  try {
    parsedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    legacyUserName = rawUser || "";
  }

  const adminName = parsedUser?.name || parsedUser?.fullName || parsedUser?.username || legacyUserName || ADMIN_PROFILE.name;
  const adminEmail = parsedUser?.email || ADMIN_PROFILE.email;

  const navClassName = ({ isActive }) =>
    `admin-nav-item${isActive ? " admin-nav-item-active" : ""}`;

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo-area">
        <div className="admin-logo-box">
          <img
            src={logoImage}
            alt="Recipe Nest Logo"
            className="admin-logo-img"
          />
        </div>
        <span className="admin-logo-text">Chif Portal</span>
        <span className="admin-logo-subtext">Admin workspace</span>
        {showUserInfo && (
          <div className="admin-meta-card">
            <div className="admin-meta-label">Signed in as</div>
            <div className="admin-meta-name">{adminName}</div>
            <div className="admin-meta-email">{adminEmail}</div>
          </div>
        )}
      </div>

      <nav className="admin-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={navClassName}
          >
            <span className="admin-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-bottom">
        <div className="admin-divider" />
        <button
          type="button"
          className="admin-sidebar-btn admin-sidebar-btn-logout"
          onClick={handleLogout}
        >
          <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </button>

        <p className="admin-sidebar-note">All admin actions are saved automatically.</p>
      </div>
    </aside>
  );
}