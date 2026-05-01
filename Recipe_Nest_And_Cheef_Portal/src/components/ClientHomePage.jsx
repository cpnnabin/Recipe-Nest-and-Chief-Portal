import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ClipboardList, Star, UsersRound } from "lucide-react";
import Navbar from "./Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseStoredUser = (rawUser) => {
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return { name: rawUser };
  }
};

const isRemovedRecipe = (recipe) =>
  String(recipe?.title || "").trim().toLowerCase() === "chatamari (nepali pizza)";

const ClientHomePage = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    const parsedUser = parseStoredUser(user);
    setLoggedInUser(parsedUser?.name || parsedUser?.username || "Nabin");
    fetchClientData();
  }, []);

  const parseRecipeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.recipes)) return payload.recipes;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchClientData = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const [recipesRes, savedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/recipes`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        }),
        token
          ? fetch(`${API_BASE_URL}/api/recipes/saved`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          : Promise.resolve(null),
      ]);

      const recipesData = recipesRes?.ok ? await recipesRes.json() : [];
      setRecipes(parseRecipeList(recipesData).filter((recipe) => !isRemovedRecipe(recipe)));

      if (savedRes?.ok) {
        const savedData = await savedRes.json();
        setSavedRecipes(parseRecipeList(savedData).filter((recipe) => !isRemovedRecipe(recipe)));
      } else {
        setSavedRecipes([]);
      }
    } catch (error) {
      console.error("Client dashboard data fetch failed:", error);
      setRecipes([]);
      setSavedRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (rawPath) => {
    if (!rawPath) return null;
    const pathStr = String(rawPath);
    const uploadsIndex = pathStr.toLowerCase().indexOf("uploads");

    if (uploadsIndex !== -1) {
      const cleanPath = pathStr.substring(uploadsIndex).replace(/\\/g, "/");
      return `${API_BASE_URL}/${cleanPath}`;
    }

    return pathStr.startsWith("/uploads") ? `${API_BASE_URL}${pathStr}` : rawPath;
  };

  const totalReviews = useMemo(
    () => recipes.reduce((sum, item) => sum + Number(item?.totalReviews || 0), 0),
    [recipes]
  );

  const averageRating = useMemo(() => {
    if (!recipes.length) return "0.0";
    const total = recipes.reduce((sum, recipe) => sum + Number(recipe?.averageRating || 0), 0);
    return (total / recipes.length).toFixed(1);
  }, [recipes]);

  const topPicks = savedRecipes.length > 0 ? savedRecipes.slice(0, 3) : recipes.slice(0, 3);
  const recentBookmarks = savedRecipes.slice(0, 4);

  const openRecipe = (recipeId) => navigate(`/recipe/${recipeId}`, { state: { from: "/client-home" } });
  const handleCardKeyDown = (event, recipeId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRecipe(recipeId);
    }
  };

  return (
    <>
      <Navbar portalName="Chif Portal" />
      <div className="dashboard-page dashboard-page-clint">
        <main className="dashboard-main">
          <section className="dashboard-welcome">
            <h1>Welcome, {loggedInUser || "Chif User"}! ✨</h1>
            <p>Your Chif dashboard is ready with curated picks and activity.</p>
          </section>

          <section className="dashboard-stats-grid">
            <article className="dashboard-stat-card dashboard-stat-card-clint">
              <ClipboardList size={36} color="#7c3aed" strokeWidth={2.2} />
              <h3>{recipes.length}</h3>
              <p>Recipe Listings</p>
            </article>
            <article className="dashboard-stat-card dashboard-stat-card-clint">
              <Bookmark size={36} color="#7c3aed" strokeWidth={2.2} />
              <h3>{savedRecipes.length}</h3>
              <p>Bookmarked Picks</p>
            </article>
            <article className="dashboard-stat-card dashboard-stat-card-clint">
              <Star size={36} color="#7c3aed" strokeWidth={2.2} />
              <h3>{averageRating}</h3>
              <p>Avg Rating</p>
            </article>
            <article className="dashboard-stat-card dashboard-stat-card-clint">
              <UsersRound size={36} color="#7c3aed" strokeWidth={2.2} />
              <h3>{totalReviews}</h3>
              <p>Total Reviews</p>
            </article>
          </section>

          <section className="dashboard-section-head">
            <h2>Chif Top Picks</h2>
            <Link to="/saved">See Bookmarks →</Link>
          </section>

          <section className="dashboard-saved-grid">
            {loading ? (
              <p className="dashboard-empty">Loading chif picks...</p>
            ) : topPicks.length === 0 ? (
              <p className="dashboard-empty">No picks available yet.</p>
            ) : (
              topPicks.map((recipe) => {
                const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
                return (
                  <article
                    key={recipe._id}
                    className="dashboard-recipe-card dashboard-recipe-card-clint"
                    role="button"
                    tabIndex={0}
                    onClick={() => openRecipe(recipe._id)}
                    onKeyDown={(e) => handleCardKeyDown(e, recipe._id)}
                  >
                    <img
                      src={imageUrl || "https://placehold.co/420x225/e2e8f0/334155?text=Chif+Pick"}
                      alt={recipe.title}
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/420x225/e2e8f0/334155?text=Chif+Pick";
                      }}
                    />
                    <div className="dashboard-recipe-content">
                      <span className="dashboard-chip dashboard-chip-clint">{recipe.category || "Trending"}</span>
                      <h3>{recipe.title || "Untitled"}</h3>
                      <p>⭐ {Number(recipe.averageRating || 0).toFixed(1)} · {recipe.totalReviews || 0} reviews</p>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <section className="dashboard-activity-wrap">
            <h2>Recent Bookmarks</h2>
            <div className="dashboard-activity-card">
              {recentBookmarks.length === 0 ? (
                <p className="dashboard-empty">No bookmark activity yet.</p>
              ) : (
                recentBookmarks.map((recipe) => {
                  const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
                  return (
                    <div
                      key={recipe._id}
                      className="dashboard-activity-item"
                      role="button"
                      tabIndex={0}
                      onClick={() => openRecipe(recipe._id)}
                      onKeyDown={(e) => handleCardKeyDown(e, recipe._id)}
                    >
                      <div className="dashboard-activity-left">
                        <img
                          src={imageUrl || "https://placehold.co/96x96/e2e8f0/334155?text=C"}
                          alt={recipe.title}
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/96x96/e2e8f0/334155?text=C";
                          }}
                        />
                        <div>
                          <h4>{recipe.title || "Untitled"}</h4>
                          <p>Bookmarked recently</p>
                        </div>
                      </div>
                      <span className="dashboard-chip dashboard-chip-clint">{recipe.category || "Trending"}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default ClientHomePage;