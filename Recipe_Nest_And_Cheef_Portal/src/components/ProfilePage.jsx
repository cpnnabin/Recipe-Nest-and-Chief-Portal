import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
  FiBookmark,
  FiClock,
  FiLock,
  FiSearch,
  FiSettings,
  FiUser,
  FiUsers,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const parseStoredUser = (rawUser) => {
  if (!rawUser) return {};

  try {
    return JSON.parse(rawUser);
  } catch {
    return { name: rawUser };
  }
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole") || "customer";
  const canManageRecipes = currentRole === "admin" || currentRole === "chief";
  const [activeTab, setActiveTab] = useState(canManageRecipes ? "myRecipes" : "saved");
  const [recipeFilter, setRecipeFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const [editRecipe, setEditRecipe] = useState(null);
  const [editRecipeData, setEditRecipeData] = useState({});
  const [editRecipeLoading, setEditRecipeLoading] = useState(false);
  const [editRecipeImageFile, setEditRecipeImageFile] = useState(null);
  const [editRecipeImagePreview, setEditRecipeImagePreview] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const ITEMS_PER_PAGE = 10;
  const [myRecipesPage, setMyRecipesPage] = useState(1);
  const [savedRecipesPage, setSavedRecipesPage] = useState(1);

  const token = localStorage.getItem("jwtToken");
  const storedUser = parseStoredUser(localStorage.getItem("loggedInUser"));

  const getImageUrl = (rawPath) => {
    if (!rawPath) return null;
    const pathStr = String(rawPath).replace(/\\/g, "/");
    if (pathStr.startsWith("http")) return pathStr;

    const idx = pathStr.toLowerCase().indexOf("uploads/");
    if (idx !== -1) return `${API_BASE_URL}/${pathStr.substring(idx)}`;

    const cleaned = pathStr.replace(/^\/+/, "");
    if (cleaned.startsWith("avatars/") || cleaned.startsWith("profile_pics/") || cleaned.startsWith("profilePics/")) {
      return `${API_BASE_URL}/uploads/${cleaned.replace("profilePics", "profile_pics")}`;
    }

    return `${API_BASE_URL}/uploads/avatars/${cleaned.replace("profilePics", "profile_pics")}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const userData = data.data?.user || data.user || data.data || {};
          setUser(userData);
          setEditName(userData?.name || "");
          setEditEmail(userData?.email || "");
          setEditPhone(userData?.phone || "");
          setEditAddress(userData?.address || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setUser(null);
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!user) return;

    setEditName((prev) => prev || user?.name || storedUser?.name || storedUser?.username || "");
    setEditEmail((prev) => prev || user?.email || "");
    setEditPhone((prev) => prev || user?.phone || "");
    setEditAddress((prev) => prev || user?.address || "");
  }, [storedUser?.name, storedUser?.username, user]);

  useEffect(() => {
    if (!user) return;
    const loadRecipes = async () => {
      setRecipeLoading(true);
      try {
        const endpoint = activeTab === "myRecipes" ? "/api/recipes/my-recipes" : "/api/recipes/saved";
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (activeTab === "myRecipes") {
          setMyRecipes(data.recipes || []);
        } else {
          setSavedRecipes(data.recipes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRecipeLoading(false);
      }
    };

    if (activeTab === "myRecipes" || activeTab === "saved") {
      loadRecipes();
    }
  }, [user, activeTab, token]);

  const handleUpdateProfile = async () => {
    setEditLoading(true);
    setEditMsg("");

    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    const phone = editPhone.trim();
    const address = editAddress.trim();

    if (!name) {
      setEditMsg("❌ Name is required");
      setEditLoading(false);
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setEditMsg("❌ Please enter a valid email address");
      setEditLoading(false);
      return;
    }

    if (phone && !/^\+?[0-9\-\s]{7,15}$/.test(phone)) {
      setEditMsg("❌ Please enter a valid phone number");
      setEditLoading(false);
      return;
    }

    const payload = {};
    if (name !== (user?.name || "")) payload.name = name;
    if (email && email !== (user?.email || "").toLowerCase()) payload.email = email;
    if (phone && phone !== (user?.phone || "")) payload.phone = phone;
    if (address && address !== (user?.address || "")) payload.address = address;

    if (Object.keys(payload).length === 0) {
      setEditMsg("ℹ️ No changes to save");
      setEditLoading(false);
      return;
    }

    const sendUpdate = async (body) => {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { res, data };
    };

    try {
      let { data } = await sendUpdate(payload);

      if (!data.success && payload.email) {
        const backendMsg = String(data.message || "");
        if (/validation failed|invalid|email/i.test(backendMsg)) {
          const { email: _email, ...fallbackPayload } = payload;
          if (Object.keys(fallbackPayload).length > 0) {
            const fallback = await sendUpdate(fallbackPayload);
            if (fallback.data?.success) {
              data = fallback.data;
              setEditMsg("✅ Profile updated (email unchanged)");
            }
          }
        }
      }

      if (data.success) {
        const userData = data.data?.user || data.user || data.data;
        setUser(userData);
        setEditName(userData?.name || name);
        setEditEmail(userData?.email || email);
        setEditPhone(userData?.phone || phone);
        setEditAddress(userData?.address || address);
        localStorage.setItem("loggedInUser", userData?.name || name);
        if (!editMsg) {
          setEditMsg("✅ Profile updated!");
        }
      } else {
        const errorText = data.message || data.errors?.[0] || "Update failed";
        setEditMsg("❌ " + errorText);
      }
    } catch {
      setEditMsg("❌ Network error");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedMime.includes(file.type)) {
      setEditMsg("❌ Please upload JPG, PNG, WEBP, or GIF image");
      e.target.value = "";
      return;
    }

    if (file.size > maxSizeBytes) {
      setEditMsg("❌ Image size should be under 5MB");
      e.target.value = "";
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    const uploadWithField = async (fieldName) => {
      const fd = new FormData();
      fd.append(fieldName, file);
      const res = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      return res.json();
    };

    setAvatarUploading(true);
    setEditMsg("");
    try {
      let data = await uploadWithField("avatar");

      if (!data?.success) {
        data = await uploadWithField("profilePic");
      }

      if (data.success) {
        const userData = data.data?.user || data.user || data.data;
        if (userData) {
          setUser(userData);
        }
        setEditMsg("✅ Avatar updated!");
      } else {
        setEditMsg("❌ " + (data.message || "Avatar update failed"));
      }
    } catch {
      setEditMsg("❌ Network error");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Remove your profile picture?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => (prev ? { ...prev, avatar: "" } : prev));
        setAvatarPreview("");
        setEditMsg("✅ Avatar removed");
      }
    } catch {
      setEditMsg("❌ Network error");
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("Delete this recipe?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMyRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (recipe) => {
    const newStatus = recipe.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`${API_BASE_URL}/api/recipes/${recipe._id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMyRecipes((prev) =>
          prev.map((r) => (r._id === recipe._id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditRecipe = (recipe) => {
    setEditRecipe(recipe);
    setEditRecipeData({
      title: recipe.title,
      description: recipe.description,
      shortDescription: recipe.shortDescription || "",
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine || "",
    });
    setEditRecipeImageFile(null);
    setEditRecipeImagePreview(getImageUrl(recipe.thumbnail || recipe.images?.[0]) || "");
  };

  const handleEditRecipeImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditRecipeImageFile(file);
    setEditRecipeImagePreview(URL.createObjectURL(file));
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("❌ Please fill all password fields");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg("❌ New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg("❌ New password and confirm password do not match");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to change password");
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMsg("✅ Password changed successfully");
    } catch (error) {
      setPasswordMsg(`❌ ${error.message || "Network error"}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveEditRecipe = async () => {
    if (!editRecipe) return;
    setEditRecipeLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", editRecipeData.title || "");
      formData.append("shortDescription", editRecipeData.shortDescription || "");
      formData.append("description", editRecipeData.description || "");
      formData.append("cookTime", editRecipeData.cookTime || "");
      formData.append("servings", editRecipeData.servings || "");
      formData.append("difficulty", editRecipeData.difficulty || "easy");
      formData.append("cuisine", editRecipeData.cuisine || "");

      if (editRecipeImageFile) {
        formData.append("thumbnail", editRecipeImageFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/recipes/${editRecipe._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const updatedRecipe = data.recipe || data.data?.recipe || data.data || { ...editRecipe, ...editRecipeData };
        setMyRecipes((prev) =>
          prev.map((r) => (r._id === editRecipe._id ? updatedRecipe : r))
        );
        setEditRecipe(null);
        setEditRecipeImageFile(null);
        setEditRecipeImagePreview("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditRecipeLoading(false);
    }
  };

  const avatarUrl = avatarPreview || getImageUrl(user?.avatar);
  const displayName = user?.name || storedUser?.name || storedUser?.username || "Chef";
  const displayEmail = user?.email || storedUser?.email || "Welcome to your profile";
  const totalViews = myRecipes.reduce((a, r) => a + (r.viewCount || 0), 0);
  const publishedCount = myRecipes.filter((recipe) => recipe.status === "published").length;
  const draftCount = myRecipes.filter((recipe) => recipe.status !== "published").length;
  const filteredMyRecipes =
    recipeFilter === "all"
      ? myRecipes
      : myRecipes.filter((recipe) =>
          recipeFilter === "published"
            ? recipe.status === "published"
            : recipe.status !== "published"
        );
  const totalMyRecipePages = useMemo(
    () => Math.max(1, Math.ceil(filteredMyRecipes.length / ITEMS_PER_PAGE)),
    [filteredMyRecipes.length]
  );
  const totalSavedRecipePages = useMemo(
    () => Math.max(1, Math.ceil(savedRecipes.length / ITEMS_PER_PAGE)),
    [savedRecipes.length]
  );
  const pagedMyRecipes = useMemo(
    () =>
      filteredMyRecipes.slice(
        (myRecipesPage - 1) * ITEMS_PER_PAGE,
        myRecipesPage * ITEMS_PER_PAGE
      ),
    [filteredMyRecipes, myRecipesPage]
  );
  const pagedSavedRecipes = useMemo(
    () =>
      savedRecipes.slice(
        (savedRecipesPage - 1) * ITEMS_PER_PAGE,
        savedRecipesPage * ITEMS_PER_PAGE
      ),
    [savedRecipes, savedRecipesPage]
  );

  useEffect(() => {
    setMyRecipesPage(1);
  }, [recipeFilter]);

  useEffect(() => {
    if (myRecipesPage > totalMyRecipePages) setMyRecipesPage(totalMyRecipePages);
  }, [myRecipesPage, totalMyRecipePages]);

  useEffect(() => {
    if (savedRecipesPage > totalSavedRecipePages) setSavedRecipesPage(totalSavedRecipePages);
  }, [savedRecipesPage, totalSavedRecipePages]);

  const profileStats = [
    { label: "Recipes", value: myRecipes.length },
    { label: "Saved", value: savedRecipes.length },
    { label: "Published", value: publishedCount },
    { label: "Drafts", value: draftCount },
    { label: "Views", value: totalViews },
  ];

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center" }}>Loading profile...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="pf-wrap pf-home-layout">
        <section className="pf-head pf-hero-card">
          <div className="pf-identity pf-hero-identity">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="pf-avatar" onError={() => setAvatarPreview("")} />
            ) : (
              <div className="pf-avatar-ph" aria-hidden="true"><FiUser /></div>
            )}

            <div className="pf-identity-copy">
              <p className="pf-kicker">Profile dashboard</p>
              <h1 className="pf-name">{displayName}</h1>
              <p className="pf-sub">{displayEmail}</p>
              <p className="pf-hero-text">
                A cleaner home-style overview of your recipes, saved items, and account controls.
              </p>
            </div>
          </div>

          <div className="pf-stats pf-home-stats">
            {profileStats.map((stat) => (
              <div className="pf-stat pf-stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pf-quick-actions">
          {canManageRecipes && (
            <button className={`pf-quick-card ${activeTab === "myRecipes" ? "active" : ""}`} onClick={() => setActiveTab("myRecipes")}>
              <FiSearch />
              <span>My Recipes</span>
            </button>
          )}
          <button className={`pf-quick-card ${activeTab === "saved" ? "active" : ""}`} onClick={() => setActiveTab("saved")}>
            <FiBookmark />
            <span>Saved</span>
          </button>
          <button className={`pf-quick-card ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
            <FiSettings />
            <span>Settings</span>
          </button>
        </section>

        <section className="pf-manage-strip">
          {canManageRecipes && (
            <>
              <button type="button" onClick={() => navigate("/add-recipe")}>+ Create New Recipe</button>
              <button type="button" onClick={() => setActiveTab("myRecipes")}>Manage My Recipes</button>
            </>
          )}
          <button type="button" onClick={() => setActiveTab("saved")}>Check Saved List</button>
          <button type="button" onClick={() => setActiveTab("settings")}>Update Profile</button>
        </section>

        <div className="pf-content pf-home-content">
          {canManageRecipes && activeTab === "myRecipes" && (
            <section className="pf-section-block">
              <div className="pf-section-head">
                <div>
                  <h2 className="pf-section-title">My Recipes</h2>
                  <p className="pf-section-sub">Published and draft recipes in a card view.</p>
                </div>
                <button className="pf-empty-btn" onClick={() => navigate("/add-recipe")}>+ Create Recipe</button>
              </div>

              <div className="pf-filter-row">
                <button
                  type="button"
                  className={`pf-filter-chip ${recipeFilter === "all" ? "active" : ""}`}
                  onClick={() => setRecipeFilter("all")}
                >
                  All ({myRecipes.length})
                </button>
                <button
                  type="button"
                  className={`pf-filter-chip ${recipeFilter === "published" ? "active" : ""}`}
                  onClick={() => setRecipeFilter("published")}
                >
                  Published ({publishedCount})
                </button>
                <button
                  type="button"
                  className={`pf-filter-chip ${recipeFilter === "draft" ? "active" : ""}`}
                  onClick={() => setRecipeFilter("draft")}
                >
                  Drafts ({draftCount})
                </button>
              </div>

              {recipeLoading ? (
                <div className="pf-empty">Loading your recipes...</div>
              ) : myRecipes.length === 0 ? (
                <div className="pf-empty">You haven't posted any recipes yet.</div>
              ) : filteredMyRecipes.length === 0 ? (
                <div className="pf-empty">No recipes found for this filter.</div>
              ) : (
                <div className="pf-grid-cards">
                  {pagedMyRecipes.map((recipe) => {
                    const imgUrl = getImageUrl(recipe.thumbnail || recipe.images?.[0]);
                    const isPublished = recipe.status === "published";

                    return (
                      <article className="pf-card pf-home-card" key={recipe._id}>
                        <div className="pf-thumb-wrap">
                          {imgUrl ? (
                            <img src={imgUrl} alt={recipe.title} className="pf-thumb" />
                          ) : (
                            <div className="pf-thumb-ph" aria-hidden="true"><FiUsers /></div>
                          )}
                          <span className={`pf-status ${isPublished ? "is-published" : "is-draft"}`}>
                            {isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="pf-card-main">
                          <span className="pf-card-chip">{recipe.category || "Recipe"}</span>
                          <h3 className="pf-title">{recipe.title}</h3>
                          <p className="pf-card-desc">{recipe.shortDescription || recipe.description?.slice(0, 110) || "Recipe details will show here."}</p>
                          <div className="pf-meta">
                            <span><FiClock aria-hidden="true" /> {recipe.cookTime}m</span>
                            <span><FiUsers aria-hidden="true" /> {recipe.servings}</span>
                          </div>
                          <div className="pf-actions">
                            <button className="pf-btn primary" onClick={() => openEditRecipe(recipe)}>Edit</button>
                            <button className="pf-btn" onClick={() => handleToggleStatus(recipe)}>{isPublished ? "Draft" : "Publish"}</button>
                            <button className="pf-btn danger" onClick={() => handleDeleteRecipe(recipe._id)}>Delete</button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {!recipeLoading && filteredMyRecipes.length > ITEMS_PER_PAGE && (
                <div className="pf-pagination">
                  <button
                    type="button"
                    className="pf-page-btn"
                    disabled={myRecipesPage <= 1}
                    onClick={() => setMyRecipesPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="pf-page-info">
                    Page {myRecipesPage} of {totalMyRecipePages}
                  </span>
                  <button
                    type="button"
                    className="pf-page-btn"
                    disabled={myRecipesPage >= totalMyRecipePages}
                    onClick={() => setMyRecipesPage((p) => Math.min(totalMyRecipePages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === "saved" && (
            <section className="pf-section-block">
              <div className="pf-section-head">
                <div>
                  <h2 className="pf-section-title">Saved Recipes</h2>
                  <p className="pf-section-sub">Quick access to the recipes you bookmarked.</p>
                </div>
                <button className="pf-empty-btn" onClick={() => navigate("/home")}>Browse Recipes</button>
              </div>

              {recipeLoading ? (
                <div className="pf-empty">Loading saved recipes...</div>
              ) : savedRecipes.length === 0 ? (
                <div className="pf-empty">No saved recipes yet.</div>
              ) : (
                <div className="pf-grid-cards">
                  {pagedSavedRecipes.map((recipe) => {
                    const imgUrl = getImageUrl(recipe.thumbnail || recipe.images?.[0]);
                    return (
                      <article className="pf-card pf-home-card" key={recipe._id}>
                        <div className="pf-thumb-wrap">
                          {imgUrl ? (
                            <img src={imgUrl} alt={recipe.title} className="pf-thumb" />
                          ) : (
                            <div className="pf-thumb-ph" aria-hidden="true"><FiUsers /></div>
                          )}
                        </div>
                        <div className="pf-card-main">
                          <span className="pf-card-chip">{recipe.category || "Saved"}</span>
                          <h3 className="pf-title">{recipe.title}</h3>
                          <p className="pf-card-desc">{recipe.shortDescription || recipe.description?.slice(0, 110) || "Bookmarked recipe."}</p>
                          <div className="pf-meta">
                            <span><FiClock aria-hidden="true" /> {recipe.cookTime}m</span>
                            <span>by {recipe.author?.name || "Chef"}</span>
                          </div>
                          <div className="pf-actions">
                            <button className="pf-btn" onClick={() => navigate(`/recipe/${recipe._id}`)}>Open</button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {!recipeLoading && savedRecipes.length > ITEMS_PER_PAGE && (
                <div className="pf-pagination">
                  <button
                    type="button"
                    className="pf-page-btn"
                    disabled={savedRecipesPage <= 1}
                    onClick={() => setSavedRecipesPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="pf-page-info">
                    Page {savedRecipesPage} of {totalSavedRecipePages}
                  </span>
                  <button
                    type="button"
                    className="pf-page-btn"
                    disabled={savedRecipesPage >= totalSavedRecipePages}
                    onClick={() => setSavedRecipesPage((p) => Math.min(totalSavedRecipePages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <section className="pf-section-block">
              <div className="pf-section-head">
                <div>
                  <h2 className="pf-section-title">Settings</h2>
                  <p className="pf-section-sub">Update your profile info and avatar.</p>
                </div>
              </div>

              <div className="pf-settings-grid">
                <div className="pf-panel">
                  <h3 className="pf-panel-title">Profile Picture</h3>
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    style={{ display: "none" }}
                    disabled={avatarUploading}
                    onChange={handleAvatarChange}
                  />
                  <div className="pf-settings-avatar-wrap">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="profile" className="pf-avatar" onError={() => setAvatarPreview("")} />
                    ) : (
                      <div className="pf-avatar-ph" aria-hidden="true"><FiUser /></div>
                    )}
                  </div>
                  <div className="pf-actions pf-settings-actions">
                    <button className="pf-btn primary" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                      {avatarUploading ? "Uploading..." : "Change Photo"}
                    </button>
                    {avatarUrl && <button className="pf-btn danger" onClick={handleDeleteAvatar}>Remove</button>}
                  </div>
                </div>

                <div className="pf-panel">
                  <h3 className="pf-panel-title">Basic Information</h3>

                  <label className="pf-label">Name</label>
                  <input className="pf-input" value={editName || displayName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />

                  <div className="pf-row" style={{ marginTop: 8 }}>
                    <div>
                      <label className="pf-label">Email</label>
                      <input className="pf-input" type="email" value={editEmail || user?.email || ""} onChange={(e) => setEditEmail(e.target.value)} placeholder="your.email@example.com" />
                    </div>
                    <div>
                      <label className="pf-label">Phone</label>
                      <input className="pf-input" type="tel" value={editPhone || user?.phone || ""} onChange={(e) => setEditPhone(e.target.value)} placeholder="+977..." />
                    </div>
                  </div>

                  <label className="pf-label" style={{ marginTop: 10 }}>Address</label>
                  <input className="pf-input" value={editAddress || user?.address || ""} onChange={(e) => setEditAddress(e.target.value)} placeholder="Your address" />

                  <button className="pf-save" onClick={handleUpdateProfile} disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                  {editMsg ? <div className="pf-msg">{editMsg}</div> : null}
                </div>

                <div className="pf-panel pf-security-panel">
                  <h3 className="pf-panel-title">Security - Change Password</h3>

                  <label className="pf-label">Current Password</label>
                  <div className="pf-input-icon-wrap">
                    <span className="pf-input-icon" aria-hidden="true"><FiLock /></span>
                    <input
                      className="pf-input pf-input-with-icon"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>

                  <label className="pf-label">New Password</label>
                  <div className="pf-input-icon-wrap">
                    <span className="pf-input-icon" aria-hidden="true"><FiLock /></span>
                    <input
                      className="pf-input pf-input-with-icon"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>

                  <label className="pf-label">Confirm Password</label>
                  <div className="pf-input-icon-wrap">
                    <span className="pf-input-icon" aria-hidden="true"><FiLock /></span>
                    <input
                      className="pf-input pf-input-with-icon"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="pf-save" onClick={handleChangePassword} disabled={passwordLoading}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                  {passwordMsg ? <div className="pf-msg">{passwordMsg}</div> : null}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {editRecipe && (
        <div className="pf-modal-backdrop" onClick={() => setEditRecipe(null)}>
          <div className="pf-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Edit Recipe</h3>

            <label className="pf-label">Recipe Image</label>
            {editRecipeImagePreview ? (
              <img src={editRecipeImagePreview} alt="recipe preview" className="pf-edit-image-preview" />
            ) : null}
            <input className="pf-input" type="file" accept="image/*" onChange={handleEditRecipeImageChange} />

            <label className="pf-label">Title</label>
            <input
              className="pf-input"
              value={editRecipeData.title || ""}
              onChange={(e) => setEditRecipeData({ ...editRecipeData, title: e.target.value })}
            />

            <label className="pf-label">Short Description</label>
            <input
              className="pf-input"
              value={editRecipeData.shortDescription || ""}
              onChange={(e) => setEditRecipeData({ ...editRecipeData, shortDescription: e.target.value })}
            />

            <label className="pf-label">Description</label>
            <textarea
              className="pf-textarea"
              value={editRecipeData.description || ""}
              onChange={(e) => setEditRecipeData({ ...editRecipeData, description: e.target.value })}
            />

            <div className="pf-row">
              <div>
                <label className="pf-label">Cook Time (min)</label>
                <input
                  className="pf-input"
                  type="number"
                  value={editRecipeData.cookTime || ""}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, cookTime: e.target.value })}
                />
              </div>
              <div>
                <label className="pf-label">Servings</label>
                <input
                  className="pf-input"
                  type="number"
                  value={editRecipeData.servings || ""}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, servings: e.target.value })}
                />
              </div>
            </div>

            <div className="pf-row">
              <div>
                <label className="pf-label">Difficulty</label>
                <select
                  className="pf-select"
                  value={editRecipeData.difficulty || "easy"}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="pf-label">Cuisine</label>
                <input
                  className="pf-input"
                  value={editRecipeData.cuisine || ""}
                  onChange={(e) => setEditRecipeData({ ...editRecipeData, cuisine: e.target.value })}
                />
              </div>
            </div>

            <button className="pf-save" onClick={handleSaveEditRecipe} disabled={editRecipeLoading}>
              {editRecipeLoading ? "Saving..." : "Save Changes"}
            </button>
            <button className="pf-btn" style={{ marginTop: 8 }} onClick={() => setEditRecipe(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfilePage;