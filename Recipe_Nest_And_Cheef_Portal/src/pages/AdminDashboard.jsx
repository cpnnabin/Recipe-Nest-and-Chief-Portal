import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("loggedInUser");

  let parsedUser = null;
  let legacyUserName = "";
  try {
    parsedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    legacyUserName = rawUser || "";
  }

  const adminName = parsedUser?.name || parsedUser?.fullName || parsedUser?.username || legacyUserName || "Chief Admin";

  const [stats, setStats] = useState({
    totalRecipes: 0,
    totalUsers: 0,
    totalComments: 0,
    avgRating: "4.2",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const statCards = [
    {
      key: "totalRecipes",
      label: "Total Recipes",
      helper: "Published recipes in the portal",
      trend: "↑ 2 this week",
      icon: "🍲",
    },
    {
      key: "totalUsers",
      label: "Community Users",
      helper: "Registered creators and users",
      trend: "↑ 12 this month",
      icon: "👥",
    },
    {
      key: "totalComments",
      label: "Comments",
      helper: "Recipe discussion activity",
      trend: "↑ 156 this month",
      icon: "💬",
    },
    {
      key: "avgRating",
      label: "Average Rating",
      helper: "Average recipe score",
      trend: "↑ 0.2 this month",
      icon: "⭐",
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("jwtToken");

        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/admin/dashboard`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (data.success) {
          setStats({
            totalRecipes: data.data.totalRecipes || 0,
            totalUsers: data.data.totalUsers || 0,
            totalComments: data.data.totalComments || 0,
            avgRating: "4.2",
          });
        } else {
          setError(data.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Server error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <Sidebar />
        <main className="admin-dashboard-main admin-dashboard-main-centered">
          <div className="admin-dashboard-state-card">
            Loading Dashboard...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <Sidebar />
        <main className="admin-dashboard-main admin-dashboard-main-centered">
          <div className="admin-dashboard-state-card admin-dashboard-state-card-error">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <Sidebar />

      <main className="admin-dashboard-main">
        <div className="admin-dashboard-topbar">
          <div>
            <h1 className="admin-dashboard-heading">{adminName}&apos;s Chif Dashboard</h1>
            <p className="admin-dashboard-subtitle">
              Welcome back! Here is a quick pulse of your recipe ecosystem.
            </p>
          </div>
          <div className="admin-dashboard-topbar-right">
            <span className="admin-dashboard-chip">Live Overview</span>
            <span className="admin-dashboard-date-chip">{todayLabel}</span>
          </div>
        </div>

        <div className="admin-dashboard-stats-row">
          {statCards.map((card) => (
            <article key={card.key} className="admin-dashboard-stat-card">
              <div className="admin-dashboard-stat-head">
                <p className="admin-dashboard-stat-label">{card.label}</p>
                <span className="admin-dashboard-stat-icon" aria-hidden="true">{card.icon}</span>
              </div>
              <p className="admin-dashboard-stat-value">{stats[card.key]}</p>
              <p className="admin-dashboard-stat-helper">{card.helper}</p>
              <p className="admin-dashboard-stat-change">{card.trend}</p>
            </article>
          ))}
        </div>

        <div className="admin-dashboard-action-row">
          <button
            type="button"
            className="admin-dashboard-action-btn"
            onClick={() => navigate("/admin/recipes")}
          >
            Manage Recipes
          </button>

          <button
            type="button"
            className="admin-dashboard-action-btn"
            onClick={() => navigate("/admin/users")}
          >
            Manage Users
          </button>

          <button
            type="button"
            className="admin-dashboard-action-btn"
            onClick={() => navigate("/admin/analytics")}
          >
            Open Analytics
          </button>
        </div>

        <section className="admin-dashboard-quick-grid">
          <button type="button" className="admin-dashboard-quick-card" onClick={() => navigate("/admin/add-recipe")}>
            <span className="admin-dashboard-quick-icon">➕</span>
            <div>
              <h3>Add Recipe</h3>
              <p>Create and publish a new recipe.</p>
            </div>
          </button>
          <button type="button" className="admin-dashboard-quick-card" onClick={() => navigate("/admin/comments")}>
            <span className="admin-dashboard-quick-icon">🛡️</span>
            <div>
              <h3>Moderate Comments</h3>
              <p>Review latest feedback and reports.</p>
            </div>
          </button>
          <button type="button" className="admin-dashboard-quick-card" onClick={() => navigate("/admin/settings")}>
            <span className="admin-dashboard-quick-icon">⚙️</span>
            <div>
              <h3>Portal Settings</h3>
              <p>Update profile and security options.</p>
            </div>
          </button>
        </section>

        <section className="admin-dashboard-grid-panels">
          <article className="admin-dashboard-panel">
            <h2>Today&apos;s Focus</h2>
            <ul>
              <li>Review newly submitted recipes and approve featured ones.</li>
              <li>Check recent comments for moderation and quality feedback.</li>
              <li>Use analytics to spot growth opportunities this week.</li>
            </ul>
          </article>

          <article className="admin-dashboard-panel">
            <h2>Quick Tips</h2>
            <ul>
              <li>Keep average rating above 4.5 by highlighting best recipes.</li>
              <li>Encourage users to save and comment by featuring weekly picks.</li>
              <li>Maintain response speed under 1 day for moderation requests.</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;