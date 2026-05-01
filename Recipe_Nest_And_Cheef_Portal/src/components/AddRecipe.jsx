import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./SideBar";
import { updateRecipe } from "../services/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CATEGORIES = ["breakfast", "lunch", "dinner", "dessert", "snack", "beverage", "other"];

const blankIngredient = { name: "", quantity: "", unit: "", isOptional: false };
const blankStep = { instruction: "" };

const getImagePreviewUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
};

const normalizeIngredients = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [{ ...blankIngredient }];
  return list.map((item) => ({
    name: item?.name || "",
    quantity: item?.quantity || "",
    unit: item?.unit || "",
    isOptional: Boolean(item?.isOptional),
  }));
};

const normalizeSteps = (list = []) => {
  if (!Array.isArray(list) || list.length === 0) return [{ ...blankStep }];
  return list.map((item) => ({
    stepNumber: item?.stepNumber,
    instruction: item?.instruction || "",
  }));
};

export default function AddRecipe() {
  const navigate = useNavigate();
  const location = useLocation();
  const recipeToEdit = location.state?.recipe || null;
  const isEditing = Boolean(recipeToEdit?._id);
  const userRole = localStorage.getItem("userRole") || "customer";
  const canManageRecipes = userRole === "admin" || userRole === "chief";
  const isAdminLayout = location.pathname.startsWith("/admin") || userRole === "chief";
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    cookTime: "",
    servings: "2",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [ingredients, setIngredients] = useState([{ ...blankIngredient }]);
  const [steps, setSteps] = useState([{ ...blankStep }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!recipeToEdit) return;

    setForm({
      title: recipeToEdit.title || "",
      description: recipeToEdit.description || "",
      category: recipeToEdit.category || "",
      cookTime: recipeToEdit.cookTime != null ? String(recipeToEdit.cookTime) : "",
      servings: recipeToEdit.servings != null ? String(recipeToEdit.servings) : "2",
    });
    setIngredients(normalizeIngredients(recipeToEdit.ingredients));
    setSteps(normalizeSteps(recipeToEdit.steps));
    setThumbnail(null);
    setThumbnailPreview(getImagePreviewUrl(recipeToEdit.thumbnail || recipeToEdit.images?.[0] || ""));
  }, [recipeToEdit]);

  useEffect(() => {
    if (!canManageRecipes) {
      navigate("/recipes", { replace: true });
    }
  }, [canManageRecipes, navigate]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addIngredient = () => setIngredients((prev) => [...prev, { ...blankIngredient }]);
  const removeIngredient = (index) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  const updateIngredient = (index, field, value) => {
    setIngredients((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addStep = () => setSteps((prev) => [...prev, { ...blankStep }]);
  const removeStep = (index) => setSteps((prev) => prev.filter((_, idx) => idx !== index));
  const updateStep = (index, value) => {
    setSteps((prev) => prev.map((item, idx) => (idx === index ? { instruction: value } : item)));
  };

  const handleThumbnail = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const submitRecipe = async (status) => {
    setError("");

    const trimmedTitle = form.title.trim();
    const trimmedDescription = form.description.trim();

    if (status === "published" && (!trimmedTitle || !trimmedDescription || !form.category || !form.cookTime)) {
      setError("Please fill in title, description, category, and cook time.");
      return;
    }

    if (status === "published" && ingredients.some((item) => !item.name || !item.quantity)) {
      setError("Please add a name and quantity for each ingredient.");
      return;
    }

    if (status === "published" && steps.some((item) => !item.instruction)) {
      setError("Please add instructions for each step.");
      return;
    }

    const draftIngredients = ingredients
      .filter((item) => item.name || item.quantity)
      .map((item) => ({
        name: item.name || "Ingredient",
        quantity: item.quantity || "1",
      }));

    const draftSteps = steps
      .filter((item) => item.instruction)
      .map((item, index) => ({
        stepNumber: index + 1,
        instruction: item.instruction,
      }));

    const finalIngredients =
      status === "published"
        ? ingredients
        : draftIngredients.length > 0
          ? draftIngredients
          : [{ name: "Ingredient", quantity: "1" }];

    const finalSteps =
      status === "published"
        ? steps.map((step, index) => ({ stepNumber: index + 1, instruction: step.instruction }))
        : draftSteps.length > 0
          ? draftSteps
          : [{ stepNumber: 1, instruction: "Add steps later" }];

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", trimmedTitle || (status === "draft" ? "Untitled Draft" : ""));
      formData.append("description", trimmedDescription || (status === "draft" ? "Draft recipe" : ""));
      formData.append("category", form.category || (status === "draft" ? "other" : ""));
      formData.append("cookTime", form.cookTime || (status === "draft" ? "0" : ""));
      formData.append("servings", form.servings || "1");
      formData.append("status", status);
      formData.append("isPublic", status === "published" ? "true" : "false");
      formData.append("ingredients", JSON.stringify(finalIngredients));
      formData.append("steps", JSON.stringify(finalSteps));

      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      if (isEditing) {
        await updateRecipe(recipeToEdit._id, formData);
      } else {
        const res = await fetch(`${API_BASE_URL}/api/recipes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
          },
          body: formData,
        });

      const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to save recipe");
        }
      }

      navigate(isAdminLayout ? "/admin/recipes" : "/recipes", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    isAdminLayout ? (
      <div className="admin-dashboard-page">
        <Sidebar />
        <main className="admin-dashboard-main">
          <div className="simple-add-recipe-page simple-add-recipe-page--admin">
            <section className="simple-add-recipe-card">
              <div className="simple-add-recipe-header">
                <button type="button" className="simple-add-recipe-back" onClick={() => navigate(-1)}>
                  ←
                </button>
                <div>
                  <h1>{isEditing ? "Edit Recipe" : "Add Recipe"}</h1>
                  <p>{isEditing ? "Update the recipe details and save your changes." : "Simple form to create and publish a recipe."}</p>
                </div>
              </div>

              {error ? <div className="simple-add-recipe-error">{error}</div> : null}

              <div className="simple-add-recipe-grid">
                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Chicken momo"
                  />
                </label>

                <label>
                  Category
                  <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Cook Time (min)
                  <input
                    type="number"
                    min="1"
                    value={form.cookTime}
                    onChange={(e) => updateField("cookTime", e.target.value)}
                    placeholder="30"
                  />
                </label>

                <label>
                  Servings
                  <input
                    type="number"
                    min="1"
                    value={form.servings}
                    onChange={(e) => updateField("servings", e.target.value)}
                    placeholder="2"
                  />
                </label>
              </div>

              <label className="simple-add-recipe-full">
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Write a short description of your recipe"
                  rows="4"
                />
              </label>

              <section className="simple-add-recipe-section">
                <div className="simple-add-recipe-section-head">
                  <h2>Cover Photo</h2>
                  <span>Optional</span>
                </div>
                <input type="file" accept="image/*" onChange={handleThumbnail} />
                {thumbnailPreview ? (
                  <img className="simple-add-recipe-preview" src={thumbnailPreview} alt="Recipe preview" />
                ) : null}
              </section>

              <section className="simple-add-recipe-section">
                <div className="simple-add-recipe-section-head">
                  <h2>Ingredients</h2>
                  <button type="button" onClick={addIngredient}>+ Add</button>
                </div>
                <div className="simple-add-recipe-stack">
                  {ingredients.map((item, index) => (
                    <div className="simple-add-recipe-row" key={`ingredient-${index}`}>
                      <input
                        value={item.name}
                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                        placeholder="Ingredient name"
                      />
                      <input
                        value={item.quantity}
                        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                        placeholder="Quantity"
                      />
                      {ingredients.length > 1 ? (
                        <button type="button" className="simple-add-recipe-remove" onClick={() => removeIngredient(index)}>
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="simple-add-recipe-section">
                <div className="simple-add-recipe-section-head">
                  <h2>Steps</h2>
                  <button type="button" onClick={addStep}>+ Add</button>
                </div>
                <div className="simple-add-recipe-stack">
                  {steps.map((item, index) => (
                    <div className="simple-add-recipe-step" key={`step-${index}`}>
                      <textarea
                        value={item.instruction}
                        onChange={(e) => updateStep(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows="3"
                      />
                      {steps.length > 1 ? (
                        <button type="button" className="simple-add-recipe-remove" onClick={() => removeStep(index)}>
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <div className="simple-add-recipe-actions">
                <button type="button" className="simple-add-recipe-secondary" onClick={() => submitRecipe("draft")} disabled={saving}>
                  {saving ? "Saving..." : isEditing ? "Save Draft Changes" : "Save Draft"}
                </button>
                <button type="button" className="simple-add-recipe-primary" onClick={() => submitRecipe("published")} disabled={saving}>
                  {saving ? "Saving..." : isEditing ? "Publish Changes" : "Publish Recipe"}
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    ) : (
      <>
        <Navbar />
        <main className="simple-add-recipe-page">
        <section className="simple-add-recipe-card">
          <div className="simple-add-recipe-header">
            <button type="button" className="simple-add-recipe-back" onClick={() => navigate(-1)}>
              ←
            </button>
            <div>
              <h1>{isEditing ? "Edit Recipe" : "Add Recipe"}</h1>
              <p>{isEditing ? "Update the recipe details and save your changes." : "Simple form to create and publish a recipe."}</p>
            </div>
          </div>

          {error ? <div className="simple-add-recipe-error">{error}</div> : null}

          <div className="simple-add-recipe-grid">
            <label>
              Title
              <input
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Chicken momo"
              />
            </label>

            <label>
              Category
              <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Cook Time (min)
              <input
                type="number"
                min="1"
                value={form.cookTime}
                onChange={(e) => updateField("cookTime", e.target.value)}
                placeholder="30"
              />
            </label>

            <label>
              Servings
              <input
                type="number"
                min="1"
                value={form.servings}
                onChange={(e) => updateField("servings", e.target.value)}
                placeholder="2"
              />
            </label>
          </div>

          <label className="simple-add-recipe-full">
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Write a short description of your recipe"
              rows="4"
            />
          </label>

          <section className="simple-add-recipe-section">
            <div className="simple-add-recipe-section-head">
              <h2>Cover Photo</h2>
              <span>Optional</span>
            </div>
            <input type="file" accept="image/*" onChange={handleThumbnail} />
            {thumbnailPreview ? (
              <img className="simple-add-recipe-preview" src={thumbnailPreview} alt="Recipe preview" />
            ) : null}
          </section>

          <section className="simple-add-recipe-section">
            <div className="simple-add-recipe-section-head">
              <h2>Ingredients</h2>
              <button type="button" onClick={addIngredient}>+ Add</button>
            </div>
            <div className="simple-add-recipe-stack">
              {ingredients.map((item, index) => (
                <div className="simple-add-recipe-row" key={`ingredient-${index}`}>
                  <input
                    value={item.name}
                    onChange={(e) => updateIngredient(index, "name", e.target.value)}
                    placeholder="Ingredient name"
                  />
                  <input
                    value={item.quantity}
                    onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                    placeholder="Quantity"
                  />
                  {ingredients.length > 1 ? (
                    <button type="button" className="simple-add-recipe-remove" onClick={() => removeIngredient(index)}>
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="simple-add-recipe-section">
            <div className="simple-add-recipe-section-head">
              <h2>Steps</h2>
              <button type="button" onClick={addStep}>+ Add</button>
            </div>
            <div className="simple-add-recipe-stack">
              {steps.map((item, index) => (
                <div className="simple-add-recipe-step" key={`step-${index}`}>
                  <textarea
                    value={item.instruction}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    rows="3"
                  />
                  {steps.length > 1 ? (
                    <button type="button" className="simple-add-recipe-remove" onClick={() => removeStep(index)}>
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <div className="simple-add-recipe-actions">
            <button type="button" className="simple-add-recipe-secondary" onClick={() => submitRecipe("draft")} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save Draft Changes" : "Save Draft"}
            </button>
            <button type="button" className="simple-add-recipe-primary" onClick={() => submitRecipe("published")} disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Publish Changes" : "Publish Recipe"}
            </button>
          </div>
        </section>
        </main>
      </>
    )
  );
}
