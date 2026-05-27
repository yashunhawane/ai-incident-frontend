"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
  type Comment as ApiComment,
} from "@/src/lib/comments";
import { getPost, type Post } from "@/src/lib/post";
import { getProject, type ProjectDetail } from "@/src/lib/project";

type Comment = {
  id: string;
  author: { name: string; initials: string; role: string };
  text: string;
  createdAt: string;
};

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "??";
}

function getAuthorName(post: Post) {
  if (post.createdBy?.name) return post.createdBy.name;
  if (typeof post.reportedBy === "object" && post.reportedBy?.name) {
    return post.reportedBy.name;
  }

  return "Unknown";
}

function formatDate(value?: string) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPostTitle(post: Post) {
  return post.description;
}

function getCommentAuthorName(comment: ApiComment) {
  if (typeof comment.author === "object" && comment.author?.name) {
    return comment.author.name;
  }

  return "Unknown";
}

function getCommentAuthorRole(comment: ApiComment) {
  if (typeof comment.author !== "object" || !comment.author?.role) {
    return "Employee";
  }

  return comment.author.role === "teamlead" ? "Team Lead" : "Employee";
}

function mapComment(comment: ApiComment): Comment {
  const authorName = getCommentAuthorName(comment);

  return {
    id: comment._id,
    author: {
      name: authorName,
      initials: getInitials(authorName),
      role: getCommentAuthorRole(comment),
    },
    text: comment.content,
    createdAt: formatDate(comment.createdAt),
  };
}

function isDeletedComment(comment: Comment) {
  return comment.text.trim().toLowerCase() === "comment deleted";
}

function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <div
      className="navAvatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function CommentCard({
  comment,
  isEditing,
  editDraft,
  isSaving,
  isDeleting,
  onEdit,
  onCancel,
  onDelete,
  onDraftChange,
  onSave,
}: {
  comment: Comment;
  isEditing: boolean;
  editDraft: string;
  isSaving: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  const deleted = isDeletedComment(comment);

  return (
    <div
      className="pd-post-card"
      style={{ alignItems: "flex-start", cursor: "default" }}
    >
      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        <Avatar initials={comment.author.initials} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span className="pd-lead-name" style={{ fontSize: 13 }}>
              {comment.author.name}
            </span>
            <span
              className="roleTag"
              style={{
                padding: "2px 8px",
                fontSize: 10,
                background:
                  comment.author.role === "teamlead"
                    ? "rgba(0,115,255,0.13)"
                    : "rgba(77,212,160,0.1)",
                color:
                  comment.author.role === "teamlead"
                    ? "var(--airis-blue-l)"
                    : "var(--airis-green)",
                marginBottom: 0,
              }}
            >
              {comment.author.role}
            </span>
            <span className="pd-post-author" style={{ marginLeft: "auto" }}>
              {comment.createdAt}
            </span>
          </div>
          {isEditing && !deleted ? (
            <div>
              <textarea
                value={editDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  outline: "none",
                  resize: "vertical",
                  padding: "0.75rem 0.85rem",
                  fontSize: 13,
                  color: "rgba(232,234,246,0.8)",
                  fontFamily: "inherit",
                  lineHeight: 1.7,
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <button
                  className="comment-action-btn"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="comment-action-btn comment-action-btn-primary"
                  onClick={onSave}
                  disabled={!editDraft.trim() || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 13,
                  color: deleted
                    ? "rgba(232,234,246,0.35)"
                    : "rgba(232,234,246,0.6)",
                  lineHeight: 1.7,
                  margin: 0,
                  fontStyle: deleted ? "italic" : "normal",
                }}
              >
                {comment.text}
              </p>
              {!deleted && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    className="comment-action-btn"
                    onClick={onEdit}
                    disabled={isDeleting}
                  >
                    Edit
                  </button>
                  <button
                    className="comment-action-btn comment-action-btn-danger"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostPage() {
  const router = useRouter();
  const { projectId, postId } = useParams<{
    projectId: string;
    postId: string;
  }>();

  const [post, setPost] = useState<Post | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!projectId || !postId) return;

    let ignore = false;

    Promise.all([
      getPost(projectId, postId),
      getProject(projectId),
      getComments(postId),
    ])
      .then(([postData, projectData, commentData]) => {
        if (ignore) return;
        setPost(postData);
        setProject(projectData);
        setComments(commentData.map(mapComment));
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Failed to fetch post");
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [projectId, postId]);

  async function handleSubmit() {
    const trimmed = draft.trim();
    if (!trimmed || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError("");

    try {
      await createComment({
        issue: postId,
        content: trimmed,
      });

      const updatedComments = await getComments(postId);
      setComments(updatedComments.map(mapComment));
      setDraft("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to add comment."
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function handleEdit(comment: Comment) {
    if (isDeletedComment(comment)) return;

    setEditingCommentId(comment.id);
    setEditDraft(comment.text);
    setCommentError("");
  }

  async function refreshComments() {
    const updatedComments = await getComments(postId);
    setComments(updatedComments.map(mapComment));
  }

  async function handleUpdateComment(commentId: string) {
    const existingComment = comments.find((comment) => comment.id === commentId);
    if (existingComment && isDeletedComment(existingComment)) return;

    const trimmed = editDraft.trim();
    if (!trimmed || savingCommentId) return;

    setSavingCommentId(commentId);
    setCommentError("");

    try {
      await updateComment(commentId, { content: trimmed });
      await refreshComments();
      setEditingCommentId(null);
      setEditDraft("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to update comment."
      );
    } finally {
      setSavingCommentId(null);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const existingComment = comments.find((comment) => comment.id === commentId);
    if (existingComment && isDeletedComment(existingComment)) return;

    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed || deletingCommentId) return;

    setDeletingCommentId(commentId);
    setCommentError("");

    try {
      await deleteComment(commentId);
      await refreshComments();
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditDraft("");
      }
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "Failed to delete comment."
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  if (loading) {
    return (
      <div className="pd-page" style={{ paddingTop: "2.5rem" }}>
        <p className="pd-loading">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pd-page" style={{ paddingTop: "2.5rem" }}>
        <button className="pd-back" onClick={() => router.back()}>
          Back to project
        </button>
        <p className="pd-error">{error || "Post not found."}</p>
      </div>
    );
  }

  const authorName = getAuthorName(post);
  const projectName = project?.title ?? project?.name ?? "Untitled Project";
  const screenshot = post.screenshots?.[0];
  const status = post.status ?? "open";

  return (
    <div className="pd-page" style={{ paddingTop: "2.5rem" }}>
      <button
        className="pd-back"
        onClick={() => router.push(`/projects/${projectId}`)}
      >
        Back to project
      </button>

      <div className="pd-header-card">
        <div className="pd-top-row">
          <h1 className="pd-project-name">{getPostTitle(post)}</h1>
          <span
            className={`pd-status-badge ${
              status === "resolved" ? "pd-status-closed" : "pd-status-active"
            }`}
          >
            <span className="pd-status-dot" />
            {status.replace("_", " ")}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div className="pd-lead-row">
            <Avatar initials={getInitials(authorName)} size={30} />
            <div>
              <div className="pd-lead-label">Posted by</div>
              <div className="pd-lead-name">{authorName}</div>
            </div>
          </div>
          <div
            className="pd-divider"
            style={{ width: 1, height: 32, margin: 0 }}
          />
          <div>
            <div className="pd-lead-label">Project</div>
            <div className="pd-lead-name" style={{ fontSize: 12 }}>
              {projectName}
            </div>
          </div>
          <div
            className="pd-divider"
            style={{ width: 1, height: 32, margin: 0 }}
          />
          <div>
            <div className="pd-lead-label">Date</div>
            <div className="pd-lead-name" style={{ fontSize: 12 }}>
              {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        <div className="pd-divider" />

        <p className="pd-description" style={{ marginBottom: 0 }}>
          {post.description}
        </p>
      </div>

      {screenshot && (
        <div
          style={{
            border: "0.5px solid var(--airis-border)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: "2rem",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "0.5px solid var(--airis-border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, color: "rgba(232,234,246,0.35)" }}>
              Image
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(232,234,246,0.35)",
              }}
            >
              Attachment
            </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot}
            alt="Issue screenshot"
            style={{
              width: "100%",
              display: "block",
              maxHeight: 420,
              objectFit: "cover",
            }}
          />
        </div>
      )}

      <div className="aiBlock" style={{ marginBottom: "2rem" }}>
        <div className="aiIcon">AI</div>
        <div style={{ flex: 1 }}>
          <div className="aiTitle">AI Summary</div>
          <p className="aiDesc">{post.aiSummary ?? "No AI summary available."}</p>
        </div>
      </div>

      <div style={{ marginBottom: "3rem" }}>
        <div className="pd-posts-header">
          <span className="pd-posts-title">
            Comments{" "}
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(232,234,246,0.35)",
              }}
            >
              ({comments.length})
            </span>
          </span>
        </div>

        <div className="pd-post-list" style={{ marginBottom: "1.5rem" }}>
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              isEditing={editingCommentId === c.id}
              editDraft={editingCommentId === c.id ? editDraft : c.text}
              isSaving={savingCommentId === c.id}
              isDeleting={deletingCommentId === c.id}
              onEdit={() => handleEdit(c)}
              onCancel={() => {
                setEditingCommentId(null);
                setEditDraft("");
              }}
              onDelete={() => handleDeleteComment(c.id)}
              onDraftChange={setEditDraft}
              onSave={() => handleUpdateComment(c.id)}
            />
          ))}
        </div>

        <div
          style={{
            border: "0.5px solid var(--airis-border)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              padding: "1rem 1.25rem",
              fontSize: 13,
              color: "rgba(232,234,246,0.8)",
              fontFamily: "inherit",
              lineHeight: 1.7,
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              padding: "0.6rem 1rem",
              borderTop: "0.5px solid var(--airis-border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "flex-end",
            }}
          >
            {commentError && (
              <span className="post-summary-error" style={{ marginRight: "auto" }}>
                {commentError}
              </span>
            )}
            <button
              className="pd-add-btn"
              onClick={handleSubmit}
              disabled={!draft.trim() || isSubmittingComment}
              style={{ opacity: draft.trim() && !isSubmittingComment ? 1 : 0.45 }}
            >
              {isSubmittingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
