import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./SideBar";
import Pagination from "./Pagination";
import CommentSection from "../pages/CommentSection";
import "../styles/RecipesPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const isRemovedRecipe = (recipe) =>
  String(recipe?.title || "").trim().toLowerCase() === "chatamari (nepali pizza)";

const Recipe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: recipeId } = useParams();
  const userRole = localStorage.getItem("userRole") || "customer";
  const canManageRecipes = userRole === "admin" || userRole === "chief";
  const isChief = userRole === "chief";
  const [recipes, setRecipes] = useState([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(Boolean(recipeId));
  const [recipeError, setRecipeError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const backTarget = location.state?.from || (canManageRecipes ? "/home" : "/recipes");

  const filters = ["All", "Breakfast", "Lunch", "Dinner", "Dessert", "Beverage"];

  const difficultyColor = {
    easy: "#4caf8a",
    medium: "#e8955a",
    hard: "#e05a5a",
  };

  const getImageUrl = (rawPath) => {
    if (!rawPath) return null;
    const pathStr = String(rawPath);
    const uploadsIndex = pathStr.toLowerCase().indexOf("uploads");
    if (uploadsIndex !== -1) {
      let cleanPath = pathStr.substring(uploadsIndex).replace(/\\/g, "/");
      return `${API_BASE_URL}/${cleanPath}`;
    }
    return pathStr.startsWith("/uploads") ? `${API_BASE_URL}${pathStr}` : null;
  };

  const handleToggleFavorite = async (e, recipeIdToToggle) => {
    e?.stopPropagation?.();
    if (savingId === recipeIdToToggle) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setSavingId(recipeIdToToggle);
      const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeIdToToggle}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update favourite");
      }

      setSavedRecipeIds((prev) => {
        const next = new Set(prev);
        if (data?.saved) {
          next.add(recipeIdToToggle);
        } else {
          next.delete(recipeIdToToggle);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    if (!recipeId) return;

    const fetchRecipeById = async () => {
      try {
        setRecipeLoading(true);
        setRecipeError(null);

        const token = localStorage.getItem("jwtToken");
        const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "Failed to fetch recipe details");
        }

        setSelectedRecipe(data.recipe || data.data?.recipe || data.data || null);
      } catch (err) {
        setRecipeError(err.message || "Something went wrong");
      } finally {
        setRecipeLoading(false);
      }
    };

    fetchRecipeById();
  }, [recipeId]);

  useEffect(() => {
    const parseRecipeList = (payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.recipes)) return payload.recipes;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.recipes)) return payload.data.recipes;
      return [];
    };

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("jwtToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const recipesEndpoint = canManageRecipes
          ? `${API_BASE_URL}/api/admin/recipes?limit=1000`
          : `${API_BASE_URL}/api/recipes`;

        const recipesRes = await fetch(recipesEndpoint, { headers });

        if (!recipesRes.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const recipesData = await recipesRes.json();
        setRecipes(parseRecipeList(recipesData).filter((recipe) => !isRemovedRecipe(recipe)));

        if (!canManageRecipes) {
          const savedRes = await fetch(`${API_BASE_URL}/api/recipes/saved`, { headers });
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            const savedList = parseRecipeList(savedData);
            setSavedRecipeIds(new Set(savedList.map((item) => item?._id).filter(Boolean)));
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [canManageRecipes, navigate]);

  const activeRecipe = selectedRecipe;
  const activeRecipeImage = getImageUrl(activeRecipe?.images?.[0] || activeRecipe?.image || activeRecipe?.thumbnail);
  const authorName =
    activeRecipe?.author?.name ||
    activeRecipe?.authorName ||
    activeRecipe?.postedBy?.name ||
    "";
  const authorAvatar =
    getImageUrl(activeRecipe?.author?.avatar) ||
    getImageUrl(activeRecipe?.postedBy?.avatar) ||
    null;
  const authorId =
    activeRecipe?.author?._id ||
    activeRecipe?.author?.id ||
    activeRecipe?.postedBy?._id ||
    activeRecipe?.postedBy?.id ||
    "";
  const authorInitial = authorName ? String(authorName).trim().charAt(0).toUpperCase() : "?";
  const recipeShareUrl = recipeId ? `${window.location.origin}/recipe/${recipeId}` : "";

  const handleShareRecipe = async () => {
    if (!activeRecipe || !recipeShareUrl) return;

    const sharePayload = {
      title: activeRecipe.title || "Recipe",
      text: activeRecipe.shortDescription || activeRecipe.description || "Check out this recipe",
      url: recipeShareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(recipeShareUrl);
        setShareFeedback("Recipe link copied!");
        setTimeout(() => setShareFeedback(""), 2200);
        return;
      }

      const tempInput = document.createElement("input");
      tempInput.value = recipeShareUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setShareFeedback("Recipe link copied!");
      setTimeout(() => setShareFeedback(""), 2200);
    } catch {
      setShareFeedback("Unable to share right now");
      setTimeout(() => setShareFeedback(""), 2200);
    }
  };

  const filteredRecipes =
    activeFilter === "All"
      ? recipes
      : recipes.filter(
          (r) =>
            r.category?.toLowerCase() === activeFilter.toLowerCase() ||
            r.mealType?.toLowerCase() === activeFilter.toLowerCase()
        );

  const finalRecipes = filteredRecipes.filter((recipe) =>
    !searchQuery
      ? true
      : recipe?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RECIPES_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(finalRecipes.length / RECIPES_PER_PAGE));
  const paginatedRecipes = finalRecipes.slice(
    (currentPage - 1) * RECIPES_PER_PAGE,
    currentPage * RECIPES_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const detailBody = recipeLoading ? (
    <div className="recipes-home-theme">
      <div className="hp-root">
        <p className="hp-loading-text">Loading recipe details...</p>
      </div>
    </div>
  ) : recipeError ? (
    <div className="recipes-home-theme">
      <div className="hp-root">
        <div className="no-results">
          <div className="no-results-emoji">⚠️</div>
          <div className="no-results-text">{recipeError}</div>
          <button className="landing-action-btn landing-action-btn-outline" onClick={() => navigate(-1)} style={{ marginTop: 18 }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  ) : activeRecipe ? (
    <div className="recipes-home-theme">
      <div className="recipe-detail-page">
        <button type="button" className="recipe-detail-back" onClick={() => navigate(backTarget)}>
          ← Back
        </button>

        <div className="recipe-detail-card">
          <img
            src={activeRecipeImage || "https://placehold.co/1200x600/e8d5b0/7a5c1e?text=Recipe+Detail"}
            alt={activeRecipe.title}
            className="recipe-detail-image"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/1200x600/e8d5b0/7a5c1e?text=Recipe+Detail";
            }}
          />

          <div className="recipe-detail-content">
            <div className="recipe-detail-top">
              <div>
                <span className="recipe-card-badge" style={{ position: "static", display: "inline-flex", marginBottom: 12 }}>
                  {activeRecipe.category || "Recipe"}
                </span>
                <h1>{activeRecipe.title}</h1>
                <p className="recipe-detail-subtitle">
                  {activeRecipe.shortDescription || activeRecipe.description || "No description available"}
                </p>

                <div className="recipe-detail-rating">
                  <span className="recipe-detail-rating-star">⭐</span>
                  <span className="recipe-detail-rating-value">
                    {Number(activeRecipe.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="recipe-detail-rating-count">
                    ({Number(activeRecipe.totalReviews || 0)} review{Number(activeRecipe.totalReviews || 0) === 1 ? "" : "s"})
                  </span>
                </div>

                {authorName ? (
                  <button
                    type="button"
                    className="recipe-detail-author"
                    title={`Posted by ${authorName}`}
                    onClick={() => {
                      if (!authorId) return;
                      navigate(`/chef/${authorId}`, { state: { from: `/recipe/${recipeId}` } });
                    }}
                  >
                    {authorAvatar ? (
                      <img
                        className="recipe-detail-author-avatar"
                        src={authorAvatar}
                        alt={authorName}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="recipe-detail-author-avatar recipe-detail-author-avatar-fallback" aria-hidden="true">
                        {authorInitial}
                      </div>
                    )}
                    <div className="recipe-detail-author-text">
                      <div className="recipe-detail-author-label">Posted by</div>
                      <div className="recipe-detail-author-name">{authorName}</div>
                    </div>
                  </button>
                ) : null}
              </div>

              <div className="recipe-detail-actions">
                <button
                  type="button"
                  className="recipe-share-btn"
                  onClick={handleShareRecipe}
                  title="Share recipe link"
                >
                  Share
                </button>

                {!canManageRecipes ? (
                  <button
                    type="button"
                    className="recipe-save-btn saved"
                    onClick={(e) => handleToggleFavorite(e, activeRecipe._id)}
                    disabled={savingId === activeRecipe._id}
                  >
                    {savingId === activeRecipe._id ? "..." : savedRecipeIds.has(activeRecipe._id) ? "Saved" : "Save Recipe"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="simple-add-recipe-primary"
                    onClick={() => navigate(isChief ? "/admin/add-recipe" : "/add-recipe", { state: { recipe: activeRecipe } })}
                  >
                    Edit Recipe
                  </button>
                )}
              </div>
            </div>

            {shareFeedback ? (
              <p className="recipe-share-feedback">{shareFeedback}</p>
            ) : null}

            <div className="recipe-detail-meta">
              {activeRecipe.cookTime ? <span>⏱ {activeRecipe.cookTime} min</span> : null}
              {activeRecipe.servings ? <span>🍽 {activeRecipe.servings} servings</span> : null}
              {activeRecipe.difficulty ? <span>⭐ {activeRecipe.difficulty}</span> : null}
              {activeRecipe.author?.name ? <span>👩‍🍳 {activeRecipe.author.name}</span> : null}
            </div>

            <section className="recipe-detail-section">
              <h2>Description</h2>
              <p>{activeRecipe.description || "No description available."}</p>
            </section>

            {Array.isArray(activeRecipe.ingredients) && activeRecipe.ingredients.length > 0 ? (
              <section className="recipe-detail-section">
                <h2>Ingredients</h2>
                <ul className="recipe-detail-list">
                  {activeRecipe.ingredients.map((ingredient, index) => (
                    <li key={`${ingredient.name || "ingredient"}-${index}`}>
                      <strong>{ingredient.quantity}</strong> {ingredient.unit ? `${ingredient.unit} ` : ""}{ingredient.name}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {Array.isArray(activeRecipe.steps) && activeRecipe.steps.length > 0 ? (
              <section className="recipe-detail-section">
                <h2>Steps</h2>
                <ol className="recipe-detail-steps">
                  {activeRecipe.steps.map((step, index) => (
                    <li key={`${step.stepNumber || index}-${index}`}>
                      <span>{step.stepNumber || index + 1}</span>
                      <p>{step.instruction}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {Array.isArray(activeRecipe.tags) && activeRecipe.tags.length > 0 ? (
              <section className="recipe-detail-section">
                <h2>Tags</h2>
                <div className="recipe-detail-tags">
                  {activeRecipe.tags.map((tag) => (
                    <span key={tag} className="recipe-detail-tag">#{tag}</span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="recipe-detail-section">
              <h2>Ratings & Comments</h2>
              <CommentSection recipeId={activeRecipe._id || recipeId} />
            </section>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (recipeId) {
    return isChief ? (
      <div className="admin-dashboard-page">
        <Sidebar />
        <div className="admin-dashboard-main">{detailBody}</div>
      </div>
    ) : (
      <>
        <Navbar />
        {detailBody}
      </>
    );
  }

  const recipeBody = (
    <div
      className={`recipes-page recipes-home-theme ${canManageRecipes ? "recipes-home-theme-admin" : ""}`}
    >

      <div className={`hp-greeting ${canManageRecipes ? "hp-greeting-admin" : ""}`}>
        <h1 className="hp-greeting-title">{canManageRecipes ? "📚 My Recipes" : "🍽️ Explore Recipes"}</h1>
        <p className="hp-greeting-sub">
          {canManageRecipes ? "All recipes from Chif Portal and Recipe Portal in one place" : "Browse recipes and add your favourites"}
        </p>
        <div className="recipes-summary-row">
          <span className="recipes-summary-pill">Total: {recipes.length}</span>
          <span className="recipes-summary-pill">Showing: {finalRecipes.length}</span>
          {activeFilter !== "All" ? <span className="recipes-summary-pill">Filter: {activeFilter}</span> : null}
        </div>
      </div>

      <div className={`hp-root ${canManageRecipes ? "hp-root-admin" : ""}`}>
        <div className={canManageRecipes ? "admin-recipes-shell" : ""}>
          <div className="recipes-page-toolbar">
            <div className={`cat-row ${canManageRecipes ? "cat-row-admin" : ""}`}>
              {filters.map((f) => (
                <button
                  key={f}
                  className={`cat-btn ${activeFilter === f ? "active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className={`search-wrap ${canManageRecipes ? "search-wrap-admin" : ""}`}>
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search recipes by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="recipes-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

        {!loading && !error && (
          <p className={`hp-result-count ${canManageRecipes ? "hp-result-count-admin" : ""}`}>
            {finalRecipes.length} {finalRecipes.length === 1 ? "recipe" : "recipes"} · Page {currentPage} of {totalPages}
          </p>
        )}

        {loading ? (
          <p className={`hp-loading-text ${canManageRecipes ? "hp-loading-text-admin" : ""}`}>Loading your recipes...</p>
        ) : error ? (
          <div className={`no-results ${canManageRecipes ? "no-results-admin" : ""}`}>
            <div className="no-results-emoji">⚠️</div>
            <div className="no-results-text">{error}</div>
            <div className="recipes-error-actions">
              <button type="button" className="landing-action-btn" onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        ) : finalRecipes.length === 0 ? (
          <div className={`no-results ${canManageRecipes ? "no-results-admin" : ""}`}>
            <div className="no-results-emoji">🍳</div>
            <div className="no-results-text">
              {activeFilter !== "All" || searchQuery
                ? "No recipes found for this filter or search."
                : canManageRecipes
                  ? "No recipes match yet. Publish a recipe from Add Recipe."
                  : "No recipes to show yet. Check back soon."}
            </div>
            {(activeFilter !== "All" || searchQuery) && (
              <button
                type="button"
                className="landing-action-btn landing-action-btn-outline"
                onClick={() => {
                  setActiveFilter("All");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`recipe-grid ${canManageRecipes ? "recipe-grid-admin" : ""}`}>
            {paginatedRecipes.map((recipe) => {
              const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
              const isSaved = savedRecipeIds.has(recipe._id);
              const isSaving = savingId === recipe._id;

              return (
                <article
                  key={recipe._id}
                  className={`recipe-card ${canManageRecipes ? "recipe-card-admin" : ""}`}
                  onClick={() => navigate(`/recipe/${recipe._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/recipe/${recipe._id}`);
                    }
                  }}
                >
                  <div className="recipe-card-img-wrap">
                    <img
                      src={imageUrl || "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image"}
                      alt={recipe.title}
                      className="recipe-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/400x210/e8d5b0/7a5c1e?text=No+Image";
                      }}
                    />
                    {recipe.category && <span className="recipe-card-badge">{recipe.category}</span>}
                    {!canManageRecipes && (
                      <button
                        className={`recipe-save-btn ${isSaved ? "saved" : ""}`}
                        onClick={(e) => handleToggleFavorite(e, recipe._id)}
                        disabled={isSaving}
                        title={isSaved ? "Remove from favourites" : "Add to favourites"}
                      >
                        {isSaving ? (
                          <span className="save-spinner" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="recipe-card-body">
                    <h3 className="recipe-card-title">{recipe.title}</h3>
                    <p className="recipe-card-desc">
                      {recipe.shortDescription || recipe.description || "No description available"}
                    </p>
                    <div className="recipe-card-meta">
                      {(recipe.cookTime || recipe.prepTime) && (
                        <span className="recipe-meta-pill">⏱ {recipe.cookTime || recipe.prepTime} min</span>
                      )}
                      {recipe.servings && <span className="recipe-meta-pill">🍽 {recipe.servings}</span>}
                      {recipe.difficulty && (
                        <span
                          className="recipe-difficulty"
                          style={{ background: difficultyColor[recipe.difficulty?.toLowerCase()] || "#e8955a" }}
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
        {!loading && !error && finalRecipes.length > RECIPES_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
        </div>
      </div>
    </div>
  );

  return (
    isChief ? (
      <div className="admin-dashboard-page">
        <Sidebar />
        <div className="admin-dashboard-main">{recipeBody}</div>
      </div>
    ) : (
      <>
        <Navbar />
        {recipeBody}
      </>
    )
  );
};

export default Recipe;