import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Sidebar from "../components/SideBar";
import { deleteUser, getAllUsers } from "../services/api";
import "../styles/UserManagement.css";



const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const getRoleBadge = (role) => {
  const map = {
    admin:    { bg: "#FEE2E2", color: "#DC2626" },
    user:     { bg: "#DBEAFE", color: "#1D4ED8" },
    chief:    { bg: "#EDE9FE", color: "#6D28D9" },
    customer: { bg: "#F3F4F6", color: "#374151" },
  };
  return map[role] || map.customer;
};

const getRoleLabel = (role) => {
  const labels = {
    customer: "Recipe Nest",
    user: "User",
    admin: "Admin",
    chief: "Chif Portal",
  };

  return labels[role] || role;
};

function UserAvatar({ user }) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  if (!user?.avatar) {
    return <InitialsAvatar user={user} />;
  }

  // Clean path and prevent double slash
  let path = user.avatar.trim();
  if (path.startsWith('/')) path = path.slice(1);

  const avatarUrl = `${BASE_URL}/${path}`;

  return (
    <>
      <img
        src={avatarUrl}
        alt={user.name || "User"}
        className="user-avatar"
        onError={(e) => {
          e.target.style.display = "none";
          const fallback = e.target.nextElementSibling;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <InitialsAvatar user={user} style={{ display: "none" }} />
    </>
  );
}

function InitialsAvatar({ user, style = {} }) {
  const initials = (user?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const COLORS = ["#2563EB", "#3B82F6", "#10B981", "#8B5CF6", "#0EA5E9"];
  const bgColor = COLORS[(user?.name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div
      className="user-avatar-fallback"
      style={{
        backgroundColor: bgColor,
        ...style,
      }}
    >
      {initials || "??"}
    </div>
  );
}

function DeleteConfirmModal({ user, onConfirm, onCancel }) {
  return (
    <div className="user-management-modal-overlay">
      <div className="user-management-modal">
        <div className="user-management-modal-icon">
          <svg width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </div>
        <h3 className="user-management-modal-title">Delete User?</h3>
        <p className="user-management-modal-text">
          Are you sure you want to permanently delete <strong>{user?.name}</strong>?<br />
          This action cannot be undone.
        </p>
        <div className="user-management-modal-actions">
          <button onClick={onCancel} className="user-management-modal-cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="user-management-modal-delete">
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const userRole = localStorage.getItem("userRole") || "customer";
  const canManageUsers = userRole === "admin" || userRole === "chief";
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const PAGE_SIZE = 10;
  const [listPage, setListPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAllUsers({ includeInactive: true, limit: 1000 });
      let list = res?.data?.users || res?.users || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const safeUsers = Array.isArray(users) ? users : [];

  const filtered = safeUsers.filter((u) => {
    const q = search.toLowerCase();
    const okSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const okRole = !roleFilter || u.role === roleFilter;
    const okStatus = !statusFilter || (statusFilter === "active" ? u.isActive : !u.isActive);
    return okSearch && okRole && okStatus;
  });

  const totalListPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  );
  const paginatedFiltered = useMemo(
    () => filtered.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE),
    [filtered, listPage]
  );

  useEffect(() => {
    setListPage(1);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    if (listPage > totalListPages) setListPage(totalListPages);
  }, [listPage, totalListPages]);

  const handleDelete = async () => {
    if (userRole !== "admin") {
      alert("Only Admin can delete user IDs.");
      return;
    }

    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete user: " + (err.message || "Unknown error"));
    }
  };

  if (!canManageUsers) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="user-management-page">
      <Sidebar />
      <main className="user-management-main">
        <h1 className="user-management-heading">Users Management</h1>
        <p className="user-management-sub">View and manage all registered users from MongoDB</p>
        {userRole !== "admin" && (
          <p className="user-management-sub" style={{ color: "#B91C1C", marginTop: "-4px" }}>
            Delete action is locked. Only Admin can delete user IDs.
          </p>
        )}

        {/* Filters */}
        <div className="user-management-row">
          <div className="user-management-search-bar">
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input 
              className="user-management-search-input" 
              placeholder="Search by name or email…" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
            {search && <button onClick={() => setSearch("")} className="user-management-clear-btn">×</button>}
          </div>
          <select className="user-management-select" value={roleFilter} onChange={(e) => setRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="chief">Chif Portal</option>
            <option value="user">User</option>
            <option value="customer">Recipe Nest</option>
          </select>
          <select className="user-management-select" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={fetchUsers} className="user-management-refresh-btn">
            ↻ Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="user-management-stats">
          {[
            { label: "Total Users", value: safeUsers.length },
            { label: "Active Users", value: safeUsers.filter(u => u.isActive).length },
            { label: "Admin Users", value: safeUsers.filter(u => u.role === "admin").length },
          ].map((st) => (
            <div key={st.label} className="user-management-stat-card">
              <div className="user-management-stat-label">{st.label}</div>
              <div className="user-management-stat-value">{loading ? "…" : st.value}</div>
            </div>
          ))}
        </div>

        {/* Table - Improved Alignment */}
        <div className="user-management-table-card">
          <div className="user-management-table-head">
            <span className="user-management-table-title">All Users</span>
            <span className="user-management-results">
              {filtered.length} results
              {filtered.length > PAGE_SIZE
                ? ` · Page ${listPage} of ${totalListPages}`
                : ""}
            </span>
          </div>

          {loading && <div className="user-management-loading">Loading users...</div>}

          {!loading && error && (
            <div className="user-management-error">
              <p>{error}</p>
              <button onClick={fetchUsers} className="user-management-try-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <table className="user-management-table">
              <thead>
                <tr>
                  {["#", "User", "Email", "Role", "Phone", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="user-management-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="user-management-empty">No users found</td></tr>
                )}
                {paginatedFiltered.map((user, idx) => (
                  <tr
                    key={user._id}
                    onClick={() => navigate(`/admin/users/${user._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="user-management-td user-management-index">
                      {(listPage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    
                    <td className="user-management-td user-management-user-cell">
                      <div className="user-management-user-wrap">
                        <div className="user-management-avatar-wrap">
                          <UserAvatar user={user} />
                        </div>
                        <div>
                          <div className="user-management-name">
                            {user.name || "Unknown User"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="user-management-td user-management-email">{user.email}</td>

                    <td className="user-management-td">
                      <div className="user-management-center">
                        <span className="user-management-chip" style={{ 
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          backgroundColor: getRoleBadge(user.role).bg, 
                          color: getRoleBadge(user.role).color,
                          whiteSpace: "nowrap"
                        }}>
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>

                    <td className="user-management-td user-management-phone">{user.phone || "—"}</td>

                    <td className="user-management-td">
                      <div className="user-management-center">
                        <span className="user-management-chip" style={{ 
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          backgroundColor: user.isActive ? "#DCFCE7" : "#FEE2E2", 
                          color: user.isActive ? "#16A34A" : "#DC2626",
                          whiteSpace: "nowrap"
                        }}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="user-management-td user-management-joined">{formatDate(user.createdAt)}</td>

                    <td className="user-management-td">
                      <div className="user-management-center">
                        {userRole === "admin" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(user);
                            }}
                            className="user-management-delete-btn"
                          >
                            Delete
                          </button>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 600 }}>
                            Locked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && !error && filtered.length > PAGE_SIZE && (
            <div
              className="user-management-pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid #E5E7EB",
              }}
            >
              <button
                type="button"
                disabled={listPage <= 1}
                onClick={() => setListPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  background: listPage <= 1 ? "#F3F4F6" : "#fff",
                  cursor: listPage <= 1 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "14px", color: "#374151" }}>
                Page {listPage} of {totalListPages}
              </span>
              <button
                type="button"
                disabled={listPage >= totalListPages}
                onClick={() => setListPage((p) => p + 1)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #D1D5DB",
                  background: listPage >= totalListPages ? "#F3F4F6" : "#fff",
                  cursor: listPage >= totalListPages ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}