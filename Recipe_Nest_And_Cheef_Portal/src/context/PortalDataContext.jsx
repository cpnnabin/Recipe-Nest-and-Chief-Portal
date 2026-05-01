import { useMemo, useState } from "react";
import {
  DEFAULT_RECIPE_IMAGE,
  adminAnalyticsSeed,
  categories,
  dashboardStats,
  featuredRecipes,
  profileRatings,
  profileSeed,
  profileStats,
  recipeDetails,
  recentActivitySeed,
  savedRecipesSeed,
} from "../Data/portalData";
import { PortalDataContext } from "./PortalDataContextDefinition";

export { PortalDataContext };

const RECIPES_KEY = "recipeNestRecipes";

function loadRecipes() {
  const raw = localStorage.getItem(RECIPES_KEY);

  if (!raw) {
    return savedRecipesSeed;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : savedRecipesSeed;
  } catch {
    return savedRecipesSeed;
  }
}

function persistRecipes(recipes) {
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

export function PortalDataProvider({ children }) {
  const [recipes, setRecipes] = useState(loadRecipes);

  const addRecipe = (recipe) => {
    const nextRecipe = {
      id: Date.now().toString(),
      image: recipe.image || DEFAULT_RECIPE_IMAGE,
      tag: recipe.tag || recipe.category || "Uncategorized",
      ...recipe,
    };

    setRecipes((current) => {
      const next = [nextRecipe, ...current];
      persistRecipes(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      dashboardStats,
      categories,
      profileStats,
      profileRatings,
      featuredRecipes,
      recipeDetails,
      savedRecipes: recipes,
      recentActivity: recentActivitySeed,
      profile: profileSeed,
      adminAnalytics: adminAnalyticsSeed,
      addRecipe,
    }),
    [recipes]
  );

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}
