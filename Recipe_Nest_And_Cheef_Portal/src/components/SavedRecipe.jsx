import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./Navbar";
import Sidebar from "./SideBar";
import "../styles/SavedRecipe.css";
import { handleSuccess } from "./utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SavedRecipes = () => {
  const currentRole = localStorage.getItem("userRole") || "customer";
  const isChief = currentRole === "chief";
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unsavingId, setUnsavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  // Fetch Saved Recipes
  const fetchSavedRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/recipes/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("jwtToken");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch (Status: ${response.status})`);
      }

      const data = await response.json();
      const list = data.recipes || data.data || [];
      setSavedRecipes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching saved recipes:", err);
      setError(err.message);
      setSavedRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedRecipes();
  }, [navigate]);

  // Unsave / Toggle Handler
  const handleUnsave = async (e, recipeId) => {
    e.stopPropagation();
    if (unsavingId === recipeId) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }

    setUnsavingId(recipeId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to unsave recipe");
      }

      if (data.saved === false) {
        setSavedRecipes((prev) => prev.filter((r) => r._id !== recipeId));
        handleSuccess("Recipe removed from saved.");
      }
    } catch (err) {
      console.error("Unsave error:", err);
    } finally {
      setUnsavingId(null);
    }
  };

  const getImageUrl = (rawPath) => {
    if (!rawPath) return null;
    const pathStr = String(rawPath);
    const uploadsIndex = pathStr.toLowerCase().indexOf("uploads");
    if (uploadsIndex !== -1) {
      return `${API_BASE_URL}/${pathStr.substring(uploadsIndex).replace(/\\/g, "/")}`;
    }
    return pathStr.startsWith("/uploads") ? `${API_BASE_URL}${pathStr}` : null;
  };

  const getDifficultyColor = (d) =>
    d === "easy" ? "#4caf50" : d === "medium" ? "#ff9800" : "#f44336";

  const openRecipeDetail = (recipeId) => {
    navigate(`/recipe/${recipeId}`, { state: { from: "/saved" } });
  };

  const handleCardKeyDown = (e, recipeId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRecipeDetail(recipeId);
    }
  };

  const filteredRecipes = savedRecipes.filter(
    (r) =>
      !searchQuery || r?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const savedBody = (
    <>
      {/* No background image for a cleaner look */}

      <div className="saved-greeting">
        <h1 className="saved-greeting-title">🔖 Saved Recipes</h1>
        <p className="saved-greeting-sub">Your personal collection of favourites</p>
        <div className="saved-summary-row">
          <span className="saved-summary-pill">Total: {savedRecipes.length}</span>
          <span className="saved-summary-pill">Showing: {filteredRecipes.length}</span>
        </div>
      </div>

      <div className="saved-root">
        {/* Search Bar */}
        <div className="saved-search-wrap">
          <span className="saved-search-icon">🔍</span>
          <input
            className="saved-search-input"
            type="text"
            placeholder="Search saved recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="saved-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        {!loading && !error && (
          <p className="saved-result-count">
            {filteredRecipes.length} saved recipe{filteredRecipes.length !== 1 ? "s" : ""}
          </p>
        )}

        {error && (
          <div className="saved-error-message">
            <p>{error}</p>
            <div className="saved-error-actions">
              <button type="button" onClick={fetchSavedRecipes}>Try Again</button>
              <button type="button" onClick={() => navigate("/recipes")}>Go to Recipes</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="hp-loading-text">Fetching your saved recipes...</p>
        ) : filteredRecipes.length === 0 && !error ? (
          <div className="saved-no-results">
            <div className="saved-no-results-emoji">🔖</div>
            <div className="saved-no-results-text">
              {searchQuery
                ? "No saved recipes match your search."
                : "You haven't saved any recipes yet. Go explore and bookmark some!"}
            </div>
            <button type="button" className="saved-empty-action" onClick={() => navigate("/recipes")}>
              Browse Recipes
            </button>
          </div>
        ) : (
          <div className="saved-recipe-grid">
            {filteredRecipes.map((recipe) => {
              const imageUrl = getImageUrl(
                recipe?.images?.[0] || recipe?.thumbnail || recipe?.image
              );
              const isRemoving = unsavingId === recipe._id;

              return (
                <article
                  key={recipe._id}
                  className="saved-recipe-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openRecipeDetail(recipe._id)}
                  onKeyDown={(e) => handleCardKeyDown(e, recipe._id)}
                >
                  <div className="saved-recipe-card-img-wrap" style={{ position: "relative" }}>
                    <img
                      src={imageUrl || "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image"}
                      alt={recipe.title || "Recipe"}
                      className="saved-recipe-card-img"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image";
                      }}
                    />
                    {recipe.category && (
                      <span className="saved-recipe-card-badge">{recipe.category}</span>
                    )}

                    <button
                      className="saved-recipe-save-btn saved"
                      onClick={(e) => handleUnsave(e, recipe._id)}
                      disabled={isRemoving}
                      title="Remove from saved"
                    >
                      {isRemoving ? (
                        <span className="save-spinner" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="saved-recipe-card-body">
                    <h3 className="saved-recipe-card-title">{recipe.title || "Untitled Recipe"}</h3>
                    <p className="saved-recipe-card-desc">
                      {recipe.shortDescription || recipe.description || "No description available"}
                    </p>
                    <div className="saved-recipe-card-meta">
                      {recipe.cookTime && <span className="saved-recipe-meta-pill">⏱ {recipe.cookTime} min</span>}
                      {recipe.servings && <span className="saved-recipe-meta-pill">🍽 {recipe.servings} servings</span>}
                      {recipe.difficulty && (
                        <span
                          className="saved-recipe-difficulty"
                          style={{ background: getDifficultyColor(recipe.difficulty) }}
                        >
                          {recipe.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ToastContainer />
    </>
  );

  return (
    isChief ? (
      <div className="admin-dashboard-page">
        <Sidebar showUserInfo={filteredRecipes.length > 0} />
        <div className="admin-dashboard-main">{savedBody}</div>
      </div>
    ) : (
      <>
        <Navbar />
        {savedBody}
      </>
    )
  );
};

export default SavedRecipes;