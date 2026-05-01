import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./SideBar";
import "../styles/RecipesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const isRemovedRecipe = (recipe) =>
  String(recipe?.title || "").trim().toLowerCase() === "chatamari (nepali pizza)";

const ChefProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: userId } = useParams();

  const userRole = localStorage.getItem("userRole") || "customer";
  const isChief = userRole === "chief";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chefUser, setChefUser] = useState(null);
  const [totalRecipesMade, setTotalRecipesMade] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    if (!userId) return;

    const fetchChefData = async () => {
      try {
        setLoading(true);
        setError("");

        const [userRes, recipeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/public/${userId}`),
          fetch(`${API_BASE_URL}/api/recipes/user/${userId}`),
        ]);

        const userJson = await userRes.json();
        if (userRes.ok && userJson?.success) {
          setChefUser(userJson?.data?.user || null);
        } else {
          setChefUser(null);
        }

        const recipeJson = await recipeRes.json();
        if (!recipeRes.ok || !recipeJson?.success) {
          throw new Error(recipeJson?.message || "Failed to load chef recipes");
        }

        // Backend responses in this repo sometimes return payload at top-level
        // (e.g. { recipes: [...] }) and sometimes inside `data` (e.g. { data: { recipes: [...] } }).
        const rawRecipes = recipeJson?.recipes ?? recipeJson?.data?.recipes ?? [];
        const list = Array.isArray(rawRecipes) ? rawRecipes : [];

        setRecipes(list.filter((r) => !isRemovedRecipe(r)));
        setTotalRecipesMade(Number(recipeJson?.totalRecipesMade ?? recipeJson?.data?.totalRecipesMade ?? 0));
      } catch (e) {
        setError(e?.message || "Something went wrong");
        setRecipes([]);
        setChefUser(null);
        setTotalRecipesMade(0);
      } finally {
        setLoading(false);
      }
    };

    fetchChefData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem("followedChefIds");
      const ids = raw ? JSON.parse(raw) : [];
      setIsFollowing(Array.isArray(ids) ? ids.includes(userId) : false);
    } catch {
      setIsFollowing(false);
    }
  }, [userId]);

  const chef = useMemo(() => {
    const any = recipes.find((r) => r?.author) || null;
    const author = any?.author || null;
    const name = chefUser?.name || author?.name || "Chef";
    const avatar = getImageUrl(chefUser?.avatar || author?.avatar);
    return { name, avatar };
  }, [chefUser, recipes]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    const q = searchQuery.toLowerCase();
    return recipes.filter((r) => String(r?.title || "").toLowerCase().includes(q));
  }, [recipes, searchQuery]);

  const backTarget = location.state?.from || "/recipes";

  const toggleFollow = () => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem("followedChefIds");
      const ids = raw ? JSON.parse(raw) : [];
      const safeIds = Array.isArray(ids) ? ids : [];
      const next = isFollowing ? safeIds.filter((id) => id !== userId) : Array.from(new Set([...safeIds, userId]));
      localStorage.setItem("followedChefIds", JSON.stringify(next));
      setIsFollowing(!isFollowing);
    } catch {
      setIsFollowing((v) => !v);
    }
  };

  const content = loading ? (
    <div className="recipes-home-theme">
      <div className="hp-root">
        <p className="hp-loading-text">Loading chef profile...</p>
      </div>
    </div>
  ) : error ? (
    <div className="recipes-home-theme">
      <div className="hp-root">
        <div className="no-results">
          <div className="no-results-emoji">⚠️</div>
          <div className="no-results-text">{error}</div>
          <button
            className="landing-action-btn landing-action-btn-outline"
            onClick={() => navigate(backTarget)}
            style={{ marginTop: 18 }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="recipes-home-theme">
      <div className="recipe-detail-page chef-profile-page">
        <button type="button" className="recipe-detail-back" onClick={() => navigate(backTarget)}>
          ← Back
        </button>

        <div className="chef-profile-card">
          <div className="chef-profile-hero">
            <div className="chef-profile-header">
            {chef.avatar ? (
              <img
                className="chef-profile-avatar"
                src={chef.avatar}
                alt={chef.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="chef-profile-avatar chef-profile-avatar-fallback" aria-hidden="true">
                {String(chef.name).trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="chef-profile-meta">
              <div className="chef-profile-label">Chif Name</div>
              <div className="chef-profile-name">{chef.name}</div>
              <div className="chef-profile-sub">Total recipes made: {totalRecipesMade}</div>
              <div className="chef-profile-pills">
                <span className="chef-pill">Published: {recipes.length}</span>
                <span className="chef-pill">Following: {isFollowing ? "Yes" : "No"}</span>
              </div>
              <div className="chef-profile-actions">
                <button
                  type="button"
                  className={`chef-follow-btn ${isFollowing ? "is-following" : ""}`}
                  onClick={toggleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>
            </div>
          </div>

          <div className="chef-recipes-toolbar">
            <div className="chef-recipes-title">
              Recipes
              <span className="chef-recipes-count">{filteredRecipes.length}</span>
            </div>
            <div className="chef-search-wrap">
              <span className="chef-search-icon">🔍</span>
              <input
                className="chef-search-input"
                type="text"
                placeholder="Search chef recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button type="button" className="chef-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  ×
                </button>
              ) : null}
            </div>
          </div>

          {recipes.length === 0 ? (
            <div className="chef-empty">
              <div className="chef-empty-icon">🍳</div>
              <div className="chef-empty-title">No published recipes yet</div>
              <div className="chef-empty-sub">When this chef publishes recipes, you’ll see them here.</div>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="chef-empty">
              <div className="chef-empty-icon">🔎</div>
              <div className="chef-empty-title">No matches found</div>
              <div className="chef-empty-sub">Try a different search keyword.</div>
            </div>
          ) : (
            <div className="chef-recipes-grid">
              {filteredRecipes.map((recipe) => {
                const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
                return (
                  <article
                    key={recipe._id}
                    className="chef-recipe-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/recipe/${recipe._id}`, { state: { from: `/chef/${userId}` } })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/recipe/${recipe._id}`, { state: { from: `/chef/${userId}` } });
                      }
                    }}
                  >
                    <img
                      className="chef-recipe-img"
                      src={imageUrl || "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image"}
                      alt={recipe.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image";
                      }}
                    />
                    <div className="chef-recipe-body">
                      <div className="chef-recipe-title">{recipe.title}</div>
                      <div className="chef-recipe-desc">
                        {recipe.shortDescription || recipe.description || "No description available"}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return isChief ? (
    <div className="admin-dashboard-page">
      <Sidebar />
      <div className="admin-dashboard-main">{content}</div>
    </div>
  ) : (
    <>
      <Navbar />
      {content}
    </>
  );
};

export default ChefProfile;

