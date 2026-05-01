import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/SideBar";
import { deleteComment, getAllComments, getAllUsers } from "../services/api";
import "../styles/CommentManagement.css";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const formatTime = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

function StarRating({ rating }) {
  if (!rating) return <span className="comment-no-rating">No rating</span>;
  return (
    <div className="comment-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`comment-star ${i <= rating ? "active" : "inactive"}`}>★</span>
      ))}
    </div>
  );
}

function AuthorAvatar({ author }) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  if (!author?.avatar) {
    return <InitialsAvatar author={author} />;
  }

  let path = author.avatar.trim();
  if (path.startsWith("/")) path = path.slice(1);

  const avatarUrl = `${BASE_URL}/${path}`;

  return (
    <>
      <img
        src={avatarUrl}
        alt={author.name || "User"}
        className="comment-avatar"
        onError={(e) => {
          e.target.style.display = "none";
          const fallback = e.target.nextElementSibling;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <InitialsAvatar author={author} style={{ display: "none" }} />
    </>
  );
}

function InitialsAvatar({ author, style = {} }) {
  const initials = (author?.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const COLORS = ["#2563EB", "#3B82F6", "#10B981", "#8B5CF6", "#0EA5E9"];
  const bgColor = COLORS[(author?.name?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <div className="comment-avatar-fallback" style={{ backgroundColor: bgColor, ...style }}>
      {initials || "??"}
    </div>
  );
}

function DeleteModal({ comment, onConfirm, onCancel }) {
  const preview = comment?.content?.slice(0, 60) + (comment?.content?.length > 60 ? "…" : "");
  return (
    <div className="comment-management-modal-overlay">
      <div className="comment-management-modal">
        <div className="comment-management-modal-icon">
          <svg width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </div>
        <h3 className="comment-management-modal-title">Delete Comment?</h3>
        <div className="comment-management-modal-preview-box">
          <p className="comment-management-modal-preview">"{preview}"</p>
        </div>
        <p className="comment-management-modal-note">This action cannot be undone.</p>
        <div className="comment-management-modal-actions">
          <button onClick={onCancel} className="comment-management-modal-cancel">Cancel</button>
          <button onClick={onConfirm} className="comment-management-modal-delete">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function CommentManagement() {
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [ratingFilter, setRating] = useState("");
  const [typeFilter, setType]     = useState("");
  const [deleteTarget, setDelete] = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [page, setPage]           = useState(1);
  const PER_PAGE = 15;

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [commentsRes, usersRes] = await Promise.all([
        getAllComments({ limit: 200 }),
        getAllUsers(),
      ]);

      let commentsList = commentsRes.data || commentsRes.comments || (Array.isArray(commentsRes) ? commentsRes : []);
      let usersList = usersRes?.data?.users || usersRes?.users || [];

      const usersMap = {};
      if (Array.isArray(usersList)) {
        usersList.forEach((user) => {
          usersMap[user._id] = user;
        });
      }

      const enrichedComments = commentsList.map((comment) => {
        if (comment.author && comment.author._id && usersMap[comment.author._id]) {
          return {
            ...comment,
            author: {
              ...comment.author,
              avatar: usersMap[comment.author._id].avatar,
            },
          };
        }
        return comment;
      });

      setComments(enrichedComments);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const filtered = comments.filter((c) => {
    const q = search.toLowerCase();
    const okSearch = !q || c.content?.toLowerCase().includes(q) || c.author?.name?.toLowerCase().includes(q) || c.recipe?.title?.toLowerCase().includes(q);
    const okRating = !ratingFilter || (ratingFilter === "rated" ? c.rating != null : c.rating == null);
    const okType   = !typeFilter || (typeFilter === "reply" ? c.parentComment != null : c.parentComment == null);
    return okSearch && okRating && okType;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(deleteTarget._id);
      await deleteComment(deleteTarget._id);
      setComments((p) => p.filter((c) => c._id !== deleteTarget._id));
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setDeleting(null);
      setDelete(null);
    }
  };

  const withRating = comments.filter((c) => c.rating != null).length;
  const avgRating  = withRating > 0
    ? (comments.filter((c) => c.rating).reduce((s, c) => s + c.rating, 0) / withRating).toFixed(1)
    : "—";
  const replies = comments.filter((c) => c.parentComment != null).length;

  return (
    <div className="comment-management-page">
      <Sidebar />
      <main className="comment-management-main">
        <h1 className="comment-management-heading">Comment Management</h1>
        <p className="comment-management-sub">Moderate and manage all comments across recipes</p>

        <div className="comment-management-filter-row">
          <div className="comment-management-search-bar">
            <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input className="comment-management-search-input" placeholder="Search comment, author or recipe…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch("")} className="comment-management-clear-btn">×</button>}
          </div>
          <select className="comment-management-select" value={ratingFilter} onChange={(e) => { setRating(e.target.value); setPage(1); }}>
            <option value="">All Comments</option>
            <option value="rated">With Rating</option>
            <option value="unrated">Without Rating</option>
          </select>
          <select className="comment-management-select" value={typeFilter} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="top">Top-level</option>
            <option value="reply">Replies</option>
          </select>
          <button onClick={fetchComments} className="comment-management-refresh-btn">↻ Refresh</button>
        </div>

        <div className="comment-management-stats">
          {[
            { label: "Total Comments", value: comments.length },
            { label: "With Ratings", value: withRating },
            { label: "Replies", value: replies },
            { label: "Avg Rating", value: avgRating },
          ].map((st) => (
            <div key={st.label} className="comment-management-stat-card">
              <div className="comment-management-stat-label">{st.label}</div>
              <div className="comment-management-stat-value">{loading ? "…" : st.value}</div>
            </div>
          ))}
        </div>

        <div className="comment-management-table-card">
          <div className="comment-management-table-head">
            <span className="comment-management-table-title">All Comments</span>
            <span className="comment-management-results">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {loading && (
            <div className="comment-management-loading">
              <div className="comment-management-spinner" />
              Loading comments from MongoDB…
            </div>
          )}

          {!loading && error && (
            <div className="comment-management-error-wrap">
              <p className="comment-management-error-title">Failed to load comments</p>
              <p className="comment-management-error-msg">{error}</p>
              <button onClick={fetchComments} className="comment-management-try-btn">Try Again</button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="comment-management-table-wrap">
                <table className="comment-management-table">
                <thead>
                  <tr>
                    {["#", "Author", "Comment", "Recipe", "Rating", "Likes", "Type", "Date", "Action"].map((h) => (
                      <th key={h} className="comment-management-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 && (
                    <tr><td colSpan={9} className="comment-management-empty">No comments match your filters.</td></tr>
                  )}
                  {paginated.map((comment, idx) => (
                    <tr key={comment._id} className={comment.isDeleted ? "comment-management-row-muted" : ""}>
                      <td className="comment-management-td">{(page - 1) * PER_PAGE + idx + 1}</td>
                      <td className="comment-management-td comment-management-author-cell">
                        <div className="comment-management-author-wrap">
                          <AuthorAvatar author={comment.author} />
                          <div>
                            <div className="comment-management-author-name">{comment.author?.name || "Unknown"}</div>
                            <div className="comment-management-author-email">{comment.author?.email || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="comment-management-td comment-management-content-cell">
                        <div className="comment-management-content-text">
                          {comment.isDeleted ? <em className="comment-management-deleted-label">[Deleted]</em> : comment.content}
                        </div>
                        {comment.isEdited && <span className="comment-management-edited">edited</span>}
                      </td>
                      <td className="comment-management-td comment-management-recipe-cell">
                        <div className="comment-management-recipe-title">
                          {comment.recipe?.title || "—"}
                        </div>
                      </td>
                      <td className="comment-management-td"><StarRating rating={comment.rating} /></td>
                      <td className="comment-management-td comment-management-likes-cell">
                        <div className="comment-management-likes-wrap">
                          <svg width="12" height="12" fill="none" stroke="#2563EB" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                          {comment.likeCount || 0}
                        </div>
                      </td>
                      <td className="comment-management-td">
                        {comment.parentComment ? "Reply" : "Top-level"}
                      </td>
                      <td className="comment-management-td comment-management-date-cell">
                        <div>{formatDate(comment.createdAt)}</div>
                        <div className="comment-management-time">{formatTime(comment.createdAt)}</div>
                      </td>
                      <td className="comment-management-td">
                        {!comment.isDeleted ? (
                          <button
                            onClick={() => setDelete(comment)}
                            disabled={deleting === comment._id}
                            className="comment-management-delete-btn">
                            {deleting === comment._id ? "…" : "Delete"}
                          </button>
                        ) : (
                          <span className="comment-management-deleted-text">Deleted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="comment-management-pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="comment-management-page-nav">
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`comment-management-page-number ${p === page ? "active" : ""}`}>
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="comment-management-page-nav">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {deleteTarget && (
        <DeleteModal
          comment={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDelete(null)}
        />
      )}
    </div>
  );
}