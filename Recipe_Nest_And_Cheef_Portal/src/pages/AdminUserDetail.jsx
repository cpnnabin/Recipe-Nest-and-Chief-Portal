import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/SideBar";
import "../styles/AdminUserDetail.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getImageUrl = (rawPath) => {
  if (!rawPath) return null;
  const pathStr = String(rawPath);
  const uploadsIndex = pathStr.toLowerCase().indexOf("uploads");
  if (uploadsIndex !== -1) {
    const cleanPath = pathStr.substring(uploadsIndex).replace(/\\/g, "/");
    return `${API_BASE_URL}/${cleanPath}`;
  }
  return pathStr.startsWith("/uploads") ? `${API_BASE_URL}${pathStr}` : null;
};

export default function AdminUserDetail() {
  const userRole = localStorage.getItem("userRole") || "customer";
  const canView = userRole === "admin" || userRole === "chief";
  const token = localStorage.getItem("jwtToken");

  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [userRes, recipeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/users/${id}`, { headers }),
          fetch(
            `${API_BASE_URL}/api/admin/recipes?limit=500&authorId=${encodeURIComponent(id)}${statusFilter ? `&status=${encodeURIComponent(statusFilter)}` : ""}`,
            { headers }
          ),
        ]);

        const userJson = await userRes.json();
        if (!userRes.ok || !userJson?.success) {
          throw new Error(userJson?.message || "Failed to load user");
        }

        const recipeJson = await recipeRes.json();
        if (!recipeRes.ok || !recipeJson?.success) {
          throw new Error(recipeJson?.message || "Failed to load user recipes");
        }

        setUser(userJson?.data?.user || null);
        setRecipes(Array.isArray(recipeJson?.recipes) ? recipeJson.recipes : []);
      } catch (e) {
        setError(e?.message || "Something went wrong");
        setUser(null);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, statusFilter, token]);

  const stats = useMemo(() => {
    const list = Array.isArray(recipes) ? recipes : [];
    const published = list.filter((r) => r.status === "published").length;
    const draft = list.filter((r) => r.status === "draft").length;
    const archived = list.filter((r) => r.status === "archived").length;
    return { total: list.length, published, draft, archived };
  }, [recipes]);

  if (!canView) return <Navigate to="/" replace />;

  return (
    <div className="aud-page">
      <Sidebar />
      <main className="aud-main">
        <div className="aud-topbar">
          <button type="button" className="aud-back" onClick={() => navigate("/admin/users")}>
            ← Back to users
          </button>
          <div className="aud-filter">
            <label className="aud-filter-label">Recipe status</label>
            <select className="aud-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="aud-loading">Loading user details…</div>
        ) : error ? (
          <div className="aud-error">
            <div className="aud-error-title">Couldn’t load user</div>
            <div className="aud-error-sub">{error}</div>
            <button type="button" className="aud-retry" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        ) : (
          <>
            <section className="aud-user-card">
              <div className="aud-user-row">
                <div className="aud-avatar">
                  {getImageUrl(user?.avatar) ? (
                    <img
                      src={getImageUrl(user?.avatar)}
                      alt={user?.name || "User"}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="aud-avatar-fallback" aria-hidden="true">
                      {(user?.name || "?").trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="aud-user-meta">
                  <div className="aud-user-name">{user?.name || "Unknown User"}</div>
                  <div className="aud-user-sub">
                    <span>{user?.email || "—"}</span>
                    <span className="aud-dot">•</span>
                    <span className="aud-role">{user?.role || "customer"}</span>
                  </div>
                </div>
              </div>

              <div className="aud-stats">
                {[
                  { label: "Total recipes", value: stats.total },
                  { label: "Published", value: stats.published },
                  { label: "Draft", value: stats.draft },
                  { label: "Archived", value: stats.archived },
                ].map((s) => (
                  <div key={s.label} className="aud-stat">
                    <div className="aud-stat-label">{s.label}</div>
                    <div className="aud-stat-value">{s.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="aud-recipes">
              <div className="aud-recipes-head">
                <div className="aud-recipes-title">Recipes by {user?.name || "user"}</div>
                <div className="aud-recipes-sub">{recipes.length} result(s)</div>
              </div>

              {recipes.length === 0 ? (
                <div className="aud-empty">No recipes found for this user.</div>
              ) : (
                <div className="aud-grid">
                  {recipes.map((r) => {
                    const img = getImageUrl(r?.thumbnail || r?.images?.[0] || r?.image);
                    return (
                      <article
                        key={r._id}
                        className="aud-recipe-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/recipe/${r._id}`, { state: { from: `/admin/users/${id}` } })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/recipe/${r._id}`, { state: { from: `/admin/users/${id}` } });
                          }
                        }}
                      >
                        <div className="aud-recipe-img">
                          {img ? <img src={img} alt={r.title} /> : <div className="aud-img-fallback">No image</div>}
                        </div>
                        <div className="aud-recipe-body">
                          <div className="aud-recipe-title">{r.title || "Untitled recipe"}</div>
                          <div className="aud-recipe-meta">
                            <span className={`aud-status aud-status-${r.status || "draft"}`}>{r.status || "draft"}</span>
                            <span>⭐ {Number(r.averageRating || 0).toFixed(1)}</span>
                            <span>•</span>
                            <span>{Number(r.totalReviews || 0)} reviews</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

