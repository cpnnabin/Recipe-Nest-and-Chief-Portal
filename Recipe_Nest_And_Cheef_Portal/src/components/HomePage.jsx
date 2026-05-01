import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Bookmark, Clock3, TrendingUp, Users } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./SideBar";

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

const HomePage = ({ portalName = "Recipe Nest", welcomeText = "Welcome to your recipe dashboard" }) => {
  const currentRole = localStorage.getItem("userRole") || "customer";
  const canManageRecipes = currentRole === "admin" || currentRole === "chief";
  const isChief = currentRole === "chief";
  const [loggedInUser, setLoggedInUser] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    const parsedUser = parseStoredUser(user);
    setLoggedInUser(parsedUser?.name || parsedUser?.username || "Sita Gurung");
    fetchDashboardData();
  }, []);

  const parseRecipeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.recipes)) return payload.recipes;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const fetchDashboardData = async () => {
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
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
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

  const formatViews = (count) =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
      count
    );

  const totalViews = useMemo(
    () =>
      recipes.reduce(
        (sum, recipe) => sum + Number(recipe?.totalViews || recipe?.views || recipe?.viewCount || 0),
        0
      ),
    [recipes]
  );

  const followers = Number(localStorage.getItem("followersCount") || 156);
  const savedPreview = savedRecipes.length > 0 ? savedRecipes.slice(0, 3) : recipes.slice(0, 3);
  const recentActivity =
    savedRecipes.length > 0 ? savedRecipes.slice(0, 4) : recipes.slice(0, 4);

  const openRecipe = (recipeId) => navigate(`/recipe/${recipeId}`, { state: { from: "/home" } });
  const handleCardKeyDown = (event, recipeId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRecipe(recipeId);
    }
  };

  const dashboardBody = (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <h1>Namaste, {loggedInUser || "Chef"}! 🙏</h1>
          <p>{welcomeText}</p>
        </section>

        <section className="dashboard-home-chips" aria-label="Quick actions">
          <Link to="/recipes" className="dashboard-home-chip">Show Recipes</Link>
          <Link to="/saved" className="dashboard-home-chip">My Favourites</Link>
          {canManageRecipes && (
            <Link to="/add-recipe" className="dashboard-home-chip dashboard-home-chip-primary">Add Recipe</Link>
          )}
        </section>

        <section className="dashboard-stats-grid">
          <article className="dashboard-stat-card">
            <BookOpen size={36} color="#2f7cec" strokeWidth={2.2} />
            <h3>{recipes.length}</h3>
            <p>Recipes Created</p>
          </article>
          <article className="dashboard-stat-card">
            <Bookmark size={36} color="#2f7cec" strokeWidth={2.2} />
            <h3>{savedRecipes.length}</h3>
            <p>Saved Recipes</p>
          </article>
          <article className="dashboard-stat-card">
            <TrendingUp size={36} color="#2f7cec" strokeWidth={2.2} />
            <h3>{formatViews(totalViews || 2400)}</h3>
            <p>Total Views</p>
          </article>
          <article className="dashboard-stat-card">
            <Users size={36} color="#2f7cec" strokeWidth={2.2} />
            <h3>{followers}</h3>
            <p>Followers</p>
          </article>
        </section>

        <section className="dashboard-section-head">
          <h2>My Saved Recipes</h2>
          <Link to="/saved">View All →</Link>
        </section>

        <section className="dashboard-saved-grid">
          {loading ? (
            <p className="dashboard-empty">Loading your recipes...</p>
          ) : savedPreview.length === 0 ? (
            <p className="dashboard-empty">No saved recipes yet.</p>
          ) : (
            savedPreview.map((recipe) => {
              const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
              return (
                <article
                  key={recipe._id}
                  className="dashboard-recipe-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openRecipe(recipe._id)}
                  onKeyDown={(e) => handleCardKeyDown(e, recipe._id)}
                >
                  <img
                    src={imageUrl || "https://placehold.co/420x225/e2e8f0/334155?text=Recipe"}
                    alt={recipe.title}
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/420x225/e2e8f0/334155?text=Recipe";
                    }}
                  />
                  <div className="dashboard-recipe-content">
                    <span className="dashboard-chip">{recipe.category || "Nepali Dish"}</span>
                    <h3>{recipe.title || "Untitled Recipe"}</h3>
                    <p>
                      <Clock3 size={16} /> {recipe.cookTime ? `${recipe.cookTime} min` : "30 min"}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="dashboard-section-head">
          <h2>All Recipes</h2>
          <Link to="/recipes">Open Recipes →</Link>
        </section>

        <section className="dashboard-saved-grid">
          {loading ? (
            <p className="dashboard-empty">Loading recipes...</p>
          ) : recipes.length === 0 ? (
            <p className="dashboard-empty">No recipes available right now.</p>
          ) : (
            recipes.slice(0, 6).map((recipe) => {
              const imageUrl = getImageUrl(recipe.images?.[0] || recipe.image || recipe.thumbnail);
              return (
                <article
                  key={`all-${recipe._id}`}
                  className="dashboard-recipe-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => openRecipe(recipe._id)}
                  onKeyDown={(e) => handleCardKeyDown(e, recipe._id)}
                >
                  <img
                    src={imageUrl || "https://placehold.co/420x225/e2e8f0/334155?text=Recipe"}
                    alt={recipe.title}
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/420x225/e2e8f0/334155?text=Recipe";
                    }}
                  />
                  <div className="dashboard-recipe-content">
                    <span className="dashboard-chip">{recipe.category || "Nepali Dish"}</span>
                    <h3>{recipe.title || "Untitled Recipe"}</h3>
                    <p>
                      <Clock3 size={16} /> {recipe.cookTime ? `${recipe.cookTime} min` : "30 min"}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section className="dashboard-activity-wrap">
          <h2>Recent Activity</h2>
          <div className="dashboard-activity-card">
            {recentActivity.length === 0 ? (
              <p className="dashboard-empty">No recent activity available.</p>
            ) : (
              recentActivity.map((recipe) => {
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
                        src={imageUrl || "https://placehold.co/96x96/e2e8f0/334155?text=R"}
                        alt={recipe.title}
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/96x96/e2e8f0/334155?text=R";
                        }}
                      />
                      <div>
                        <h4>{recipe.title || "Untitled Recipe"}</h4>
                        <p>Viewed 2 hours ago</p>
                      </div>
                    </div>
                    <span className="dashboard-chip">
                      {recipe.category || "Nasta (Breakfast)"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );

  return (
    isChief ? (
      <div className="admin-dashboard-page">
        <Sidebar />
        <div className="admin-dashboard-main">{dashboardBody}</div>
      </div>
    ) : (
      <>
        <Navbar portalName={portalName} />
        {dashboardBody}
      </>
    )
  );
};

export default HomePage;