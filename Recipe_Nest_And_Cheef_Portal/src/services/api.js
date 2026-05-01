/**
 * api.js — Recipe Nest Admin API Helper
 *
 * Reads the JWT token from localStorage (key: "jwtToken").
 * All admin calls use the Authorization: Bearer <token> header.
 *
 * Base URL reads from VITE_API_URL env var, falls back to localhost:3000.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ─────────────────────────────────────────────
// Internal fetch wrapper
// ─────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem("jwtToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data;
}

// ═════════════════════════════════════════════
// USER ENDPOINTS  (Admin only)
// ═════════════════════════════════════════════

/**
 * GET /api/users
 * Returns all registered users.
 */
export const getAllUsers = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
  ).toString();
  return request(`/api/users${qs ? `?${qs}` : ""}`);
};

/**
 * GET /api/users/:id
 * Returns a single user by ID.
 */
export const getUserById = (id) => request(`/api/users/${id}`);

/**
 * DELETE /api/users/:id
 * Permanently deletes a user (admin only).
 */
export const deleteUser = (id) =>
  request(`/api/users/${id}`, { method: "DELETE" });

/**
 * PATCH /api/users/:id/status
 * Toggles the isActive status of a user (admin only).
 */
export const toggleUserStatus = (id) =>
  request(`/api/users/${id}/status`, { method: "PATCH" });

/**
 * DELETE /api/users/:id (soft delete)
 * Deactivates (soft-deletes) a user.
 */
export const deactivateUser = (id) =>
  request(`/api/users/${id}`, { method: "DELETE" });

// ═════════════════════════════════════════════
// RECIPE ENDPOINTS
// ═════════════════════════════════════════════

/**
 * GET /api/admin/recipes?page=&limit=&status=&category=
 * Returns paginated recipes for admin/chief (full MongoDB set).
 * Pass query params as an object: { page, limit, status, category }
 */
export const getAllRecipes = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
  ).toString();
  return request(`/api/admin/recipes${qs ? `?${qs}` : ""}`);
};

/**
 * GET /api/recipes/:id — public read of a single recipe (full document for edits).
 */
export const getRecipeById = (id) => request(`/api/recipes/${id}`);

/**
 * DELETE /api/recipes/:id
 * Deletes a recipe (owner or admin).
 */
export const deleteRecipe = (id) =>
  request(`/api/recipes/${id}`, { method: "DELETE" });

/**
 * PUT /api/recipes/:id
 * Updates an existing recipe (admin/chief only).
 * Accepts FormData so images can be replaced when needed.
 */
export const updateRecipe = async (id, formData) => {
  const token = localStorage.getItem("jwtToken");

  const res = await fetch(`${BASE_URL}/api/recipes/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data;
};

/**
 * PATCH /api/recipes/:id/feature
 * Toggles the isFeatured flag (admin only).
 */
export const toggleFeaturedRecipe = (id) =>
  request(`/api/recipes/${id}/feature`, { method: "PATCH" });

/**
 * PATCH /api/recipes/:id/status
 * Changes recipe status: "draft" | "published" | "archived"
 */
export const changeRecipeStatus = (id, status) =>
  request(`/api/recipes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// ═════════════════════════════════════════════
// COMMENT ENDPOINTS  (Admin)
// ═════════════════════════════════════════════

/**
 * GET /api/comments?page=&limit=&recipeId=&authorId=
 * Returns all comments across the platform (admin only).
 */
export const getAllComments = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))
  ).toString();
  return request(`/api/comments${qs ? `?${qs}` : ""}`);
};

/**
 * DELETE /api/comments/:id/admin
 * Force-deletes any comment regardless of ownership (admin only).
 */
export const deleteComment = (id) =>
  request(`/api/comments/${id}/admin`, { method: "DELETE" });

// ═════════════════════════════════════════════
// ADMIN ANALYTICS
// ═════════════════════════════════════════════

/**
 * GET /api/admin/analytics
 * Returns analytics snapshot for Chif Portal.
 */
export const getAdminAnalytics = () => request("/api/admin/analytics");
