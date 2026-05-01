    /**
     * CommentSection.jsx
     *
     * Embeds inside the recipe detail modal.
     * Connects to:
     *   GET  /api/comments/recipe/:recipeId   — load comments
     *   POST /api/comments/recipe/:recipeId   — post comment (with optional star rating)
     *   POST /api/comments/:id/like           — toggle like
     *   POST /api/comments/recipe/:recipeId   — post reply (parentComment in body)
     *   DELETE /api/comments/:id              — delete own comment
     *   PATCH  /api/comments/:id              — edit own comment
     */

    import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/CommentSection.css";

    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // ── Star Rating Component ───────────────────────────────────────────────────
    const StarRating = ({ value, onChange, readonly = false }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="cs-stars" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
            key={star}
            type="button"
            className={`cs-star ${star <= (hovered || value) ? "cs-star--filled" : ""}`}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange && onChange(star === value ? 0 : star)}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
            ★
            </button>
        ))}
        </div>
    );
    };

    // ── Single Comment Card ─────────────────────────────────────────────────────
    const CommentCard = ({
    comment,
    currentUserId,
    token,
    recipeId,
    onDeleted,
    onLiked,
    depth = 0,
    }) => {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);
    const [liked, setLiked] = useState(
        comment.likes?.some((id) =>
        id === currentUserId || id?._id === currentUserId || id?.toString?.() === currentUserId
        ) || false
    );
    const [likeCount, setLikeCount] = useState(comment.likeCount ?? comment.likes?.length ?? 0);
    const [replies, setReplies] = useState(comment.replies || []);
    const [loadingLike, setLoadingLike] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [editLoading, setEditLoading] = useState(false);
    const [displayContent, setDisplayContent] = useState(comment.content);
    const [isEdited, setIsEdited] = useState(comment.isEdited || false);
    const textareaRef = useRef(null);
    const editTextareaRef = useRef(null);

    const isOwner = comment.author?._id === currentUserId || comment.author === currentUserId;
    const avatarUrl = comment.author?.avatar
        ? `${API_BASE_URL}/${String(comment.author.avatar).replace(/\\/g, "/").split("uploads").pop()?.replace(/^\//, "")}`
        : null;

    const timeAgo = (dateStr) => {
        const diff = (Date.now() - new Date(dateStr)) / 1000;
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const handleLike = async () => {
        if (!token || loadingLike) return;
        setLoadingLike(true);
        try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${comment._id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setLiked(data.liked);
            setLikeCount(data.likeCount);
            onLiked?.(comment._id, data.liked, data.likeCount);
        }
        } catch (err) {
        console.error("Like error:", err);
        } finally {
        setLoadingLike(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this comment?")) return;
        try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${comment._id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) onDeleted?.(comment._id);
        } catch (err) {
        console.error("Delete error:", err);
        }
    };

    const handleEditSave = async () => {
        if (!editText.trim() || editLoading) return;
        if (editText.trim() === displayContent) { setIsEditing(false); return; }
        setEditLoading(true);
        try {
        const res = await fetch(`${API_BASE_URL}/api/comments/${comment._id}`, {
            method: "PATCH",
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: editText.trim() }),
        });
        const data = await res.json();
        if (data.success) {
            setDisplayContent(editText.trim());
            setIsEdited(true);
            setIsEditing(false);
        }
        } catch (err) {
        console.error("Edit error:", err);
        } finally {
        setEditLoading(false);
        }
    };

    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
        editTextareaRef.current.focus();
        const len = editTextareaRef.current.value.length;
        editTextareaRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const handleReply = async () => {
        if (!replyText.trim() || replyLoading) return;
        setReplyLoading(true);
        try {
        const res = await fetch(`${API_BASE_URL}/api/comments/recipe/${recipeId}`, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: replyText.trim(), parentComment: comment._id }),
        });
        const data = await res.json();
        if (data.success) {
            setReplies((prev) => [...prev, data.comment]);
            setReplyText("");
            setShowReplyBox(false);
        }
        } catch (err) {
        console.error("Reply error:", err);
        } finally {
        setReplyLoading(false);
        }
    };

    useEffect(() => {
        if (showReplyBox && textareaRef.current) textareaRef.current.focus();
    }, [showReplyBox]);

    return (
        <div className={`cs-comment ${depth > 0 ? "cs-comment--reply" : ""}`}>
        {/* Avatar + meta row */}
        <div className="cs-comment-header">
            <div className="cs-avatar">
            {avatarUrl ? (
                <img src={avatarUrl} alt={comment.author?.name} onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
                <span className="cs-avatar-initial">
                {comment.author?.name?.[0]?.toUpperCase() || "?"}
                </span>
            )}
            </div>
            <div className="cs-comment-meta">
            <span className="cs-author-name">{comment.author?.name || "Chef"}</span>
            {comment.rating && (
                <StarRating value={comment.rating} readonly />
            )}
            <span className="cs-timestamp">{timeAgo(comment.createdAt)}</span>
            </div>
            {isOwner && (
            <div className="cs-owner-actions">
                <button
                className="cs-edit-btn"
                onClick={() => { setIsEditing(true); setEditText(displayContent); }}
                title="Edit comment"
                >
                ✏️
                </button>
                <button className="cs-delete-btn" onClick={handleDelete} title="Delete comment">
                🗑
                </button>
            </div>
            )}
        </div>

        {/* Comment text or edit box */}
        {isEditing ? (
            <div className="cs-edit-box">
            <textarea
                ref={editTextareaRef}
                className="cs-textarea cs-edit-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleEditSave();
                if (e.key === "Escape") { setIsEditing(false); setEditText(displayContent); }
                }}
                rows={3}
                maxLength={1000}
            />
            <div className="cs-reply-actions">
                <button
                className="cs-reply-cancel"
                onClick={() => { setIsEditing(false); setEditText(displayContent); }}
                >
                Cancel
                </button>
                <button
                className="cs-reply-submit"
                onClick={handleEditSave}
                disabled={!editText.trim() || editLoading}
                >
                {editLoading ? "Saving…" : "Save Edit"}
                </button>
            </div>
            </div>
        ) : (
            <p className="cs-comment-text">
            {displayContent}
            {isEdited && <span className="cs-edited"> (edited)</span>}
            </p>
        )}

        {/* Actions */}
        <div className="cs-comment-actions">
            <button
            className={`cs-action-btn cs-like-btn ${liked ? "cs-like-btn--active" : ""}`}
            onClick={handleLike}
            disabled={!token || loadingLike}
            title={liked ? "Unlike" : "Like"}
            >
            <span className="cs-like-icon">♥</span>
            <span>{likeCount > 0 ? likeCount : ""}</span>
            </button>

            {depth === 0 && token && (
            <button
                className="cs-action-btn cs-reply-btn"
                onClick={() => setShowReplyBox((v) => !v)}
            >
                ↩ Reply
            </button>
            )}
        </div>

        {/* Reply input box */}
        {showReplyBox && (
            <div className="cs-reply-box">
            <textarea
                ref={textareaRef}
                className="cs-reply-input"
                placeholder={`Reply to ${comment.author?.name || "Chef"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                maxLength={1000}
            />
            <div className="cs-reply-actions">
                <button
                className="cs-reply-cancel"
                onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                >
                Cancel
                </button>
                <button
                className="cs-reply-submit"
                onClick={handleReply}
                disabled={!replyText.trim() || replyLoading}
                >
                {replyLoading ? "Posting…" : "Post Reply"}
                </button>
            </div>
            </div>
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
            <div className="cs-replies">
            {replies.map((reply) => (
                <CommentCard
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                token={token}
                recipeId={recipeId}
                depth={1}
                onDeleted={(id) => setReplies((prev) => prev.filter((r) => r._id !== id))}
                onLiked={() => {}}
                />
            ))}
            </div>
        )}
        </div>
    );
    };

    // ── Main CommentSection ─────────────────────────────────────────────────────
    const CommentSection = ({ recipeId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [text, setText] = useState("");
    const [rating, setRating] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("jwtToken");
    const currentUserId = (() => {
        try {
        if (!token) return null;
        return JSON.parse(atob(token.split(".")[1])).id;
        } catch { return null; }
    })();

    // ── Fetch comments ──────────────────────────────────────────────────────
    const fetchComments = useCallback(async (pageNum = 1, append = false) => {
        if (!recipeId) return;
        try {
        const res = await fetch(
            `${API_BASE_URL}/api/comments/recipe/${recipeId}?page=${pageNum}&limit=5`
        );
        const data = await res.json();
        if (data.success) {
            const incoming = data.comments || [];
            setComments((prev) => append ? [...prev, ...incoming] : incoming);
            setTotalCount(data.totalCount || 0);
            setHasMore(pageNum < (data.totalPages || 1));
            setPage(pageNum);
        }
        } catch (err) {
        console.error("Fetch comments error:", err);
        } finally {
        setLoading(false);
        }
    }, [recipeId]);

    useEffect(() => {
        setComments([]);
        setPage(1);
        setLoading(true);
        fetchComments(1, false);
    }, [recipeId, fetchComments]);

    // ── Post comment ────────────────────────────────────────────────────────
    const handlePost = async () => {
        if (!text.trim()) { setError("Please write something first."); return; }
        if (!token) { setError("You must be logged in to comment."); return; }
        setError("");
        setPosting(true);
        try {
        const body = { content: text.trim() };
        if (rating > 0) body.rating = rating;

        const res = await fetch(`${API_BASE_URL}/api/comments/recipe/${recipeId}`, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) {
            setComments((prev) => [data.comment, ...prev]);
            setTotalCount((c) => c + 1);
            setText("");
            setRating(0);
        } else {
            setError(data.message || "Failed to post comment.");
        }
        } catch {
        setError("Network error. Please try again.");
        } finally {
        setPosting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
    };

    return (
        <>
        <div className="cs-root">
            {/* Heading */}
            <div className="cs-heading">
                ?? Community Notes
                {totalCount > 0 && <span className="cs-count-badge">{totalCount}</span>}
            </div>
            {/* Compose box or login prompt */}
            {token ? (
                <div className="cs-compose">
                    <div className="cs-compose-label">Leave a note for the chef</div>
                    <div className="cs-compose-rating-row">
                        <span className="cs-compose-rating-label">Rate this recipe:</span>
                        <StarRating value={rating} onChange={setRating} />
                        {rating > 0 && (
                            <button className="cs-clear-rating-btn" onClick={() => setRating(0)}>
                                clear
                            </button>
                        )}
                    </div>
                    <textarea
                        className="cs-textarea"
                        placeholder="Share a tip, substitution, or how it turned out for you? (Ctrl+Enter to post)"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        maxLength={1000}
                    />
                    <div className="cs-compose-footer">
                        <span className="cs-char-count">{text.length}/1000</span>
                        <button
                            className="cs-post-btn"
                            onClick={handlePost}
                            disabled={posting || !text.trim()}
                        >
                            {posting ? "Posting?" : "Post Note"}
                        </button>
                    </div>
                    {error && <div className="cs-error">? {error}</div>}
                </div>
            ) : (
                <div className="cs-login-prompt">
                    ?? <strong>Log in</strong> to leave a comment or rating
                </div>
            )}
            {/* Comments list */}
            {loading ? (
                <div className="cs-loading">Loading comments?</div>
            ) : comments.length === 0 ? (
                <div className="cs-empty">
                    <div className="cs-empty-icon">??</div>
                    Be the first to leave a note for the chef!
                </div>
            ) : (
                <>
                    <div className="cs-list">
                        {comments.map((comment) => (
                            <CommentCard
                                key={comment._id}
                                comment={comment}
                                currentUserId={currentUserId}
                                token={token}
                                recipeId={recipeId}
                                onDeleted={(id) => {
                                    setComments((prev) => prev.filter((c) => c._id !== id));
                                    setTotalCount((c) => c - 1);
                                }}
                                onLiked={() => {}}
                            />
                        ))}
                    </div>
                    {hasMore && (
                        <button
                            className="cs-load-more"
                            onClick={() => fetchComments(page + 1, true)}
                        >
                            Load more comments
                        </button>
                    )}
                </>
            )}
        </div>
        </>
    );
};
export default CommentSection;
