import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "../components/SideBar";
import {
  changeRecipeStatus,
  deleteRecipe,
  getAllRecipes,
  toggleFeaturedRecipe,
} from "../services/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CATEGORY_COLORS = {
  breakfast: { bg: "#FEF9C3", color: "#854D0E" },
  lunch:     { bg: "#DBEAFE", color: "#1D4ED8" },
  dinner:    { bg: "#EDE9FE", color: "#6D28D9" },
  dessert:   { bg: "#FCE7F3", color: "#BE185D" },
  snack:     { bg: "#D1FAE5", color: "#065F46" },
  beverage:  { bg: "#FFEDD5", color: "#C2410C" },
  soup:      { bg: "#FEE2E2", color: "#991B1B" },
  salad:     { bg: "#ECFDF5", color: "#047857" },
  appetizer: { bg: "#E0F2FE", color: "#0369A1" },
  other:     { bg: "#F3F4F6", color: "#374151" },
};

const STATUS_STYLES = {
  published: { bg: "#DCFCE7", color: "#16A34A" },
  draft:     { bg: "#FEF9C3", color: "#A16207" },
  archived:  { bg: "#F3F4F6", color: "#6B7280" },
};

// Build full image URL
const buildImageSrc = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  let cleanPath = path.trim().replace(/^\/+/, "");

  // Fix folder name if needed
  cleanPath = cleanPath.replace(/recipeImages/gi, "recipe_images");

  return `${BASE}/${cleanPath}`;
};

function RecipeThumbnail({ recipe }) {
  // Priority: Use first image from 'images' array (since thumbnail is null)
  let imagePath = null;

  if (recipe.images && Array.isArray(recipe.images) && recipe.images.length > 0) {
    imagePath = recipe.images[0];           // First image is usually the main one
  } else if (recipe.thumbnail) {
    imagePath = recipe.thumbnail;
  } else if (recipe.image) {
    imagePath = recipe.image;
  }

  const src = buildImageSrc(imagePath);

  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={recipe.title}
        onError={() => setImgError(true)}
        style={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          objectFit: "cover",
          flexShrink: 0,
          border: "2px solid #fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      />
    );
  }

  // Fallback
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "12px",
        background: "linear-gradient(135deg, #F0EDE8, #E0DCD6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        flexShrink: 0,
        border: "2px solid #fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        color: "#888",
      }}
    >
      🍽️
    </div>
  );
}

function StatusDropdown({ recipeId, current, onChange }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const statuses = ["published", "draft", "archived"];

  const handleSelect = async (status) => {
    if (status === current) { setOpen(false); return; }
    try {
      setLoading(true); setOpen(false);
      await changeRecipeStatus(recipeId, status);
      onChange(recipeId, status);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally { setLoading(false); }
  };

  const ss = STATUS_STYLES[current] || STATUS_STYLES.draft;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        style={{
          padding: "3px 11px 3px 10px",
          borderRadius: "20px",
          border: `1.5px solid ${ss.color}30`,
          background: ss.bg,
          color: ss.color,
          fontSize: "11.5px",
          fontWeight: "600",
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {loading ? "…" : current}
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
            backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            border: "1px solid #F0EDE8", minWidth: "130px", overflow: "hidden",
          }}>
            {statuses.map((s) => {
              const ts = STATUS_STYLES[s];
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", padding: "9px 14px", border: "none",
                    background: s === current ? "#F8F5F2" : "transparent",
                    cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
                    color: "#333", textAlign: "left",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: ts.color, flexShrink: 0 }} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DeleteModal({ recipe, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "32px", width: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", fontFamily: "inherit" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </div>
        <h3 style={{ textAlign: "center", fontSize: "17px", fontWeight: "700", color: "#1A1A2E", marginBottom: "8px" }}>Delete Recipe?</h3>
        <p style={{ textAlign: "center", fontSize: "13.5px", color: "#666", marginBottom: "24px", lineHeight: 1.6 }}>
          Are you sure you want to permanently delete<br /><strong>"{recipe?.title}"</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: "1.5px solid #E0DDD8", background: "transparent", fontSize: "14px", fontWeight: "600", cursor: "pointer", color: "#555" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: "9px", border: "none", background: "#DC2626", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const HEADERS = [
  { label: "#",         align: "center" },
  { label: "Recipe",    align: "left" },
  { label: "Author",    align: "center" },
  { label: "Category",  align: "center" },
  { label: "Difficulty",align: "center" },
  { label: "Rating",    align: "center" },
  { label: "Views",     align: "center" },
  { label: "Status",    align: "center" },
  { label: "Featured",  align: "center" },
  { label: "Actions",   align: "center" },
];

const s = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "'Outfit', 'Nunito', sans-serif", backgroundColor: "#F8FAFC" },
  main: { flex: 1, backgroundColor: "#F8FAFC", padding: "32px 36px", overflowY: "auto" },
  heading: { fontSize: "30px", fontWeight: "700", color: "#0F172A", margin: "0 0 4px 0" },
  sub: { fontSize: "13px", color: "#888", margin: "0 0 22px 0" },
  filterRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" },
  searchBar: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff", borderRadius: "50px", padding: "10px 20px", flex: 1, maxWidth: "380px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  searchInput: { border: "none", outline: "none", background: "transparent", fontSize: "14px", color: "#333", width: "100%", fontFamily: "inherit" },
  select: { padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #E0DDD8", background: "#fff", fontSize: "13.5px", fontFamily: "inherit", color: "#444", cursor: "pointer", outline: "none" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" },
  statCard: { backgroundColor: "#fff", borderRadius: "14px", padding: "16px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  statLabel: { fontSize: "12px", color: "#888", marginBottom: "5px", fontWeight: "500" },
  statValue: { fontSize: "22px", fontWeight: "700", color: "#1A1A2E" },
  tableCard: { backgroundColor: "#fff", borderRadius: "16px", padding: "24px 28px", boxShadow: "0 8px 24px rgba(15,23,42,0.06)", border: "1px solid #E2E8F0" },
  td: { padding: "13px 8px", fontSize: "13.5px", color: "#333", borderBottom: "1px solid #F5F2EE", verticalAlign: "middle" },
};

export default function RecipeManagement() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "";
  const isChief = userRole === "chief";
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCat] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [deleteTarget, setDelete] = useState(null);
  const [, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const PAGE_SIZE = 10;
  const [listPage, setListPage] = useState(1);

  const getCurrentUserId = () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return (
        decoded?._id ||
        decoded?.id ||
        decoded?.userId ||
        decoded?.sub ||
        null
      );
    } catch {
      return null;
    }
  };

  const isOwnedByCurrentUser = (recipe, currentUserId) => {
    if (!currentUserId || !recipe) return false;
    const authorId =
      recipe?.author?._id ||
      recipe?.author?.id ||
      recipe?.author ||
      recipe?.userId ||
      recipe?.createdBy;
    return String(authorId || "") === String(currentUserId);
  };

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllRecipes({ limit: 1000 });
      const list = res?.recipes || res?.data?.recipes || res?.data || (Array.isArray(res) ? res : []);
      if (isChief) {
        const currentUserId = getCurrentUserId();
        const ownRecipes = list.filter((recipe) => isOwnedByCurrentUser(recipe, currentUserId));
        setRecipes(ownRecipes);
      } else {
        setRecipes(list);
      }

      // Debug log - Remove after testing
      if (list.length > 0) {
        console.log("Sample Recipe Object:", list[0]);
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch recipes error:", err);
    } finally {
      setLoading(false);
    }
  }, [isChief]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    const okSearch = !q || r.title?.toLowerCase().includes(q) || r.author?.name?.toLowerCase().includes(q);
    const okCat = !catFilter || r.category === catFilter;
    const okStatus = !statusFilter || r.status === statusFilter;
    return okSearch && okCat && okStatus;
  });

  const totalListPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );
  const paginatedFiltered = useMemo(
    () => filtered.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE),
    [filtered, listPage]
  );

  useEffect(() => {
    setListPage(1);
  }, [search, catFilter, statusFilter]);

  useEffect(() => {
    if (listPage > totalListPages) setListPage(totalListPages);
  }, [listPage, totalListPages]);

  const handleStatusChange = (recipeId, newStatus) => {
    setRecipes((p) => p.map((r) => r._id === recipeId ? { ...r, status: newStatus } : r));
  };

  const handleToggleFeatured = async (recipe) => {
    try {
      setToggling(recipe._id);
      await toggleFeaturedRecipe(recipe._id);
      setRecipes((p) => p.map((r) => r._id === recipe._id ? { ...r, isFeatured: !r.isFeatured } : r));
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget._id);
      await deleteRecipe(deleteTarget._id);
      setRecipes((p) => p.filter((r) => r._id !== deleteTarget._id));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
      setDelete(null);
    }
  };

  const handleEditRecipe = (recipe) => {
    navigate("/admin/add-recipe", { state: { recipe } });
  };

  const categories = [...new Set(recipes.map((r) => r.category).filter(Boolean))];

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        <h1 style={s.heading}>Recipe Management</h1>
        <p style={s.sub}>View and manage all recipes from MongoDB</p>

        {/* Filters */}
        <div style={s.filterRow}>
          <div style={s.searchBar}>
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              style={s.searchInput}
              placeholder="Search recipe or author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: "18px" }}>×</button>}
          </div>

          <select style={s.select} value={catFilter} onChange={(e) => setCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>

          <select style={s.select} value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <button onClick={fetchRecipes} style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: "#2563EB", color: "#fff", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}>
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: "Total Recipes", value: recipes.length },
            { label: "Published", value: recipes.filter(r => r.status === "published").length },
            { label: "Draft", value: recipes.filter(r => r.status === "draft").length },
            { label: "Featured", value: recipes.filter(r => r.isFeatured).length },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statValue}>{loading ? "…" : st.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={s.tableCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A2E" }}>All Recipes</span>
            <span style={{ fontSize: "12px", color: "#aaa" }}>
              {filtered.length} results
              {filtered.length > PAGE_SIZE ? ` · Page ${listPage} of ${totalListPages}` : ""}
            </span>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa" }}>Loading recipes...</div>}

          {!loading && error && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#DC2626" }}>
              <p>Failed to load recipes</p>
              <button onClick={fetchRecipes} style={{ marginTop: "10px", padding: "8px 20px", background: "#2563EB", color: "#fff", border: "none", borderRadius: "10px" }}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {HEADERS.map((h) => (
                    <th key={h.label} style={{
                      textAlign: h.align,
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#888",
                      paddingBottom: "12px",
                      borderBottom: "2px solid #F0EDE8",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ ...s.td, textAlign: "center", padding: "60px 0", color: "#bbb" }}>No recipes found</td></tr>
                )}

                {paginatedFiltered.map((recipe, idx) => {
                  const cat = CATEGORY_COLORS[recipe.category] || CATEGORY_COLORS.other;
                  return (
                    <tr key={recipe._id}>
                      <td style={{ ...s.td, color: "#ccc", textAlign: "center", width: "32px" }}>
                        {(listPage - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      <td style={{ ...s.td, textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <RecipeThumbnail recipe={recipe} />
                          <div>
                            <div style={{ fontWeight: "600", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {recipe.title}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#888" }}>
                              {recipe.cookTime || 0} min • {recipe.servings || 0} servings
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ ...s.td, color: "#555", textAlign: "center" }}>{recipe.author?.name || "—"}</td>

                      <td style={{ ...s.td, textAlign: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "600", backgroundColor: cat.bg, color: cat.color }}>
                          {recipe.category}
                        </span>
                      </td>

                      <td style={{ ...s.td, color: "#888", textAlign: "center", textTransform: "capitalize" }}>{recipe.difficulty || "—"}</td>

                      <td style={{ ...s.td, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", justifyContent: "center" }}>
                          <span style={{ color: "#F59E0B" }}>★</span>
                          <span style={{ fontWeight: "600" }}>{recipe.averageRating?.toFixed(1) || "0.0"}</span>
                        </div>
                      </td>

                      <td style={{ ...s.td, color: "#888", textAlign: "center" }}>{(recipe.viewCount || 0).toLocaleString()}</td>

                      <td style={{ ...s.td, textAlign: "center" }}>
                        <StatusDropdown recipeId={recipe._id} current={recipe.status || "draft"} onChange={handleStatusChange} />
                      </td>

                      <td style={{ ...s.td, textAlign: "center" }}>
                        <button onClick={() => handleToggleFeatured(recipe)} disabled={toggling === recipe._id} style={{ background: "none", border: "none", fontSize: "20px" }}>
                          {toggling === recipe._id ? "…" : recipe.isFeatured ? "⭐" : "☆"}
                        </button>
                      </td>

                      <td style={{ ...s.td, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleEditRecipe(recipe)}
                            style={{ padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button onClick={() => setDelete(recipe)} style={{ padding: "5px 12px", borderRadius: "7px", border: "1.5px solid #FCA5A5", background: "transparent", color: "#DC2626", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && !error && filtered.length > PAGE_SIZE && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #E2E8F0",
              }}
            >
              <button
                type="button"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: listPage <= 1 ? "#F1F5F9" : "#fff",
                  cursor: listPage <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "14px", color: "#475569" }}>
                Page {listPage} of {totalListPages}
              </span>
              <button
                type="button"
                disabled={listPage >= totalListPages}
                onClick={() => setListPage((p) => p + 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CBD5E1",
                  background: listPage >= totalListPages ? "#F1F5F9" : "#fff",
                  cursor: listPage >= totalListPages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && <DeleteModal recipe={deleteTarget} onConfirm={handleDelete} onCancel={() => setDelete(null)} />}
    </div>
  );
}