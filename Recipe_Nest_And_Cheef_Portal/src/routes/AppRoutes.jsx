import { Navigate, Route, Routes } from "react-router-dom";

import Landing from "../components/LandingPage";
import ClintLandingPage from "../components/ClintLandingPage";
import LoginPage from "../components/LoginPage";
import SignupPage from "../components/SignupPage";
import ForgotPasswordPage from "../components/ForgotPasswordPage";
import ResetPasswordPage from "../components/ResetPasswordPage";
import HomePage from "../components/HomePage";
import ClientHomePage from "../components/ClientHomePage";
import Recipe from "../components/Recipe";
import AddRecipe from "../components/AddRecipe";
import SavedRecipes from "../components/SavedRecipe";
import ProfilePage from "../components/ProfilePage";
import ChefProfile from "../components/ChefProfile";

import AdminDashboard from "../pages/AdminDashboard";
import AdminAnalytics from "../pages/AdminAnalytics";
import AdminSettings from "../pages/AdminSettings";
import RecipeManagement from "../pages/RecipeManagement";
import UserManagement from "../pages/UserManagement";
import AdminUserDetail from "../pages/AdminUserDetail";
import CommentManagement from "../pages/CommentManagement";

function AppRoutes({ isAuthenticated, userRole, authLoading }) {
  const isAdmin = userRole === "admin" || userRole === "chief";
  const canManageRecipes = userRole === "admin" || userRole === "chief";
  const isChief = userRole === "chief";
  const roleHomePath = userRole === "user" ? "/client-home" : "/home";
  const loadingElement = <div style={{ textAlign: "center", padding: "80px" }}>Loading...</div>;
  const notFoundElement = <h2 style={{ textAlign: "center", padding: "100px" }}>404 - Page Not Found</h2>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/landing-chif" element={<ClintLandingPage />} />
      <Route path="/landing-clint" element={<Navigate to="/landing-chif" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      <Route
        path="/home"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : userRole === "user"
                ? <Navigate to="/client-home" replace />
                : userRole === "admin"
                  ? <Navigate to="/admin" replace />
                  : isChief
                    ? <HomePage />
                  : <HomePage />
        }
      />
      <Route
        path="/client-home"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : userRole !== "user"
                ? userRole === "customer"
                  ? <Navigate to="/home" replace />
                  : userRole === "chief"
                    ? <Navigate to="/home" replace />
                    : <Navigate to="/admin" replace />
                : <ClientHomePage />
        }
      />
      <Route
        path="/recipes"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/recipe/:id"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/breakfast"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/lunch"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dinner"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dessert"
        element={authLoading ? loadingElement : isAuthenticated ? <Recipe /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/add-recipe"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : canManageRecipes
                ? <AddRecipe />
                : <Navigate to="/recipes" replace />
        }
      />
      <Route
        path="/saved"
        element={authLoading ? loadingElement : isAuthenticated ? <SavedRecipes /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/profile"
        element={authLoading ? loadingElement : isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/chef/:id"
        element={authLoading ? loadingElement : isAuthenticated ? <ChefProfile /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/admin"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <AdminDashboard />
        }
      />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
      <Route
        path="/admin/recipes"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <RecipeManagement />
        }
      />
      <Route
        path="/admin/add-recipe"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <AddRecipe />
        }
      />
      <Route
        path="/admin/users"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <UserManagement />
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <AdminUserDetail />
        }
      />
      <Route
        path="/admin/analytics"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <AdminAnalytics />
        }
      />
      <Route
        path="/admin/comments"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <CommentManagement />
        }
      />
      <Route
        path="/admin/settings"
        element={
          authLoading
            ? loadingElement
            : !isAuthenticated
              ? <Navigate to="/login" replace />
              : !isAdmin
                ? <Navigate to={roleHomePath} replace />
                : <AdminSettings />
        }
      />

      <Route path="*" element={notFoundElement} />
    </Routes>
  );
}

export default AppRoutes;
