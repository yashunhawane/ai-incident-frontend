"use client";

import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { aiApiUrl } from "@/src/lib/api";
import { createPost, uploadPostImage } from "@/src/lib/post";
import { getProject, type ProjectDetail } from "@/src/lib/project";

type SummaryState = "idle" | "loading" | "done" | "error";
type ProjectContext = {
  id: string;
  name: string;
  status: "active" | "closed";
  lead: { name: string };
};

export default function AddPostPage() {
  return (
    <Suspense
      fallback={
        <main className="pageMain">
          <div className="contentWrap">
            <div className="pd-page">
              <p className="pd-loading">Loading project...</p>
            </div>
          </div>
        </main>
      }
    >
      <AddPostContent />
    </Suspense>
  );
}

function AddPostContent() {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();

  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [summary, setSummary] = useState("");
  const [summaryState, setSummaryState] = useState<SummaryState>("idle");
  const [summaryError, setSummaryError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fetchedProject, setFetchedProject] = useState<ProjectDetail | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFromNavigation = useMemo<ProjectContext | null>(() => {
    const name = searchParams.get("projectName");
    const status = searchParams.get("projectStatus");
    const leadName = searchParams.get("teamLeadName");

    if (!projectId || !name || (status !== "active" && status !== "closed")) {
      return null;
    }

    return {
      id: projectId,
      name,
      status,
      lead: { name: leadName ?? "" },
    };
  }, [projectId, searchParams]);

  useEffect(() => {
    if (!projectId || projectFromNavigation) return;

    let ignore = false;

    getProject(projectId)
      .then((data) => {
        if (!ignore) setFetchedProject(data);
      })
      .catch(() => {
        if (!ignore) setFetchedProject(null);
      });

    return () => {
      ignore = true;
    };
  }, [projectId, projectFromNavigation]);

  const project =
    projectFromNavigation ??
    (fetchedProject
      ? {
          id: fetchedProject._id,
          name: fetchedProject.title ?? fetchedProject.name ?? "Untitled Project",
          status: fetchedProject.status,
          lead: { name: fetchedProject.teamLead.name },
        }
      : {
          id: projectId,
          name: "Loading project...",
          status: "active" as const,
          lead: { name: "" },
        });

  // ── Image handling ─────────────────────────────────────────────────────────
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setSubmitError("");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setSummary("");
    setSummaryState("idle");
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setSummary("");
    setSummaryState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── AI Summarise ──────────────────────────────────────────────────────────
  const handleSummarise = async () => {
    if (!description.trim() && !imageFile) return;
    setSummaryState("loading");
    setSummaryError("");
    setSummary("");

    try {
      const payload = new FormData();
      payload.append("description", description);
      if (imageFile) {
        payload.append("image", imageFile);
      }

      const response = await fetch(aiApiUrl("/api/summarize"), {
        method: "POST",
        body: payload,
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text =
        data &&
        typeof data === "object" &&
        "data" in data &&
        data.data &&
        typeof data.data === "object" &&
        "summary" in data.data &&
        typeof data.data.summary === "string"
          ? data.data.summary
          : typeof data.summary === "string"
            ? data.summary
            : typeof data.text === "string"
              ? data.text
              : typeof data.message === "string"
                ? data.message
                : "";

      setSummary(text || "No summary generated.");
      setSummaryState("done");
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to generate summary."
      );
      setSummaryState("error");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!description.trim()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const screenshots = imageFile ? [await uploadPostImage(imageFile)] : [];
      const aiSummary = summaryState === "done" ? summary : null;

      await createPost({
        project: projectId,
        description: description.trim(),
        screenshots,
        aiSummary,
        aiSummaryGeneratedAt: aiSummary ? new Date().toISOString() : null,
        status: "open",
      });

      setSubmitted(true);
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to post issue."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = description.trim().length > 0 && !isSubmitting && !submitted;
  const canSummarise =
    (description.trim().length > 0 || !!imageFile) && summaryState !== "loading";

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="pageMain">
        <div className="contentWrap post-success-wrap">
          <div className="post-success-card">
            <div className="post-success-icon">✅</div>
            <div className="sectionTitle post-success-title">
              Issue Posted!
            </div>
            <div className="heroSub">Redirecting back to project…</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pageMain">
      <div className="contentWrap">


        <div className="pd-page">

          {/* Back */}
          <button className="pd-back" onClick={() => router.back()}>
            ← Back to project
          </button>

          {/* Project context strip */}
          <div className="post-context-strip">
            <div className="pd-post-icon">
              📁
            </div>
            <div>
              <div className="post-context-label">
                Posting to
              </div>
              <div className="post-context-name">
                {project.name}
              </div>
            </div>
            <div className="post-context-status">
              <span
                className={`pd-status-badge ${
                  project.status === "active"
                    ? "pd-status-active"
                    : "pd-status-closed"
                }`}
              >
                <span className="pd-status-dot" />
                {project.status}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="post-heading">
            <div className="sectionTag">Issue Report</div>
            <h1 className="sectionTitle">Post New Issue</h1>
            <p className="sectionSub">
              Describe the problem and optionally attach a screenshot. Use{" "}
              <strong className="post-emphasis">
                AI Summarise
              </strong>{" "}
              to generate a concise summary before posting.
            </p>
          </div>

          {/* FORM CARD */}
          <div className="pd-header-card post-form-card">

            {/* Description */}
            <div className="post-field">
              <label className="post-field-label">
                Description{" "}
                <span className="post-required">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (summaryState === "done") setSummaryState("idle");
                }}
                placeholder="Describe the issue — what happened, what was expected, steps to reproduce…"
                rows={5}
                className="post-textarea"
              />
              <div className="post-char-count">
                {description.length} chars
              </div>
            </div>

            {/* Image upload */}
            <div className="post-field">
              <label className="post-field-label">
                Screenshot{" "}
                <span className="post-optional">
                  (optional)
                </span>
              </label>

              {!imagePreview ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`post-dropzone ${
                    isDragging ? "post-dropzone-active" : ""
                  }`}
                >
                  <div className="post-dropzone-icon">
                    🖼️
                  </div>
                  <div className="post-dropzone-text">
                    Drag & drop or{" "}
                    <span className="post-emphasis">browse</span>
                  </div>
                  <div className="post-dropzone-meta">
                    PNG · JPG · GIF · WEBP
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="post-file-input"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleImageSelect(e.target.files[0])
                    }
                  />
                </div>
              ) : (
                <div className="post-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Issue screenshot"
                    className="post-preview-image"
                  />
                  <div className="post-preview-overlay">
                    <span className="post-preview-name">
                      📎 {imageFile?.name}
                    </span>
                    <button
                      onClick={removeImage}
                      className="post-remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI Summarise trigger */}
            <div className="post-summarise-row">
              <button
                onClick={handleSummarise}
                disabled={!canSummarise}
                className="post-ai-btn"
              >
                {summaryState === "loading" ? (
                  <>
                    <span className="post-spinner">
                      ⟳
                    </span>
                    Summarising…
                  </>
                ) : (
                  <>✦ AI Summarise</>
                )}
              </button>
            </div>
          </div>

          {/* AI SUMMARY RESULT CARD */}
          {summaryState !== "idle" && (
            <div
              className={`post-summary-card ${
                summaryState === "error" ? "post-summary-card-error" : ""
              }`}
            >
              <div className="post-summary-header">
                <div className="aiIcon post-summary-icon">
                  {summaryState === "loading"
                    ? "⟳"
                    : summaryState === "error"
                    ? "⚠️"
                    : "✦"}
                </div>
                <div className="aiTitle post-summary-title">
                  {summaryState === "loading"
                    ? "Generating AI Summary…"
                    : summaryState === "error"
                    ? "Summary Failed"
                    : "AI-Generated Summary"}
                </div>
                {summaryState === "done" && (
                  <span className="post-ready-badge">
                    Ready
                  </span>
                )}
              </div>

              {summaryState === "loading" && (
                <div className="post-pulse-row">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`post-pulse-dot post-pulse-dot-${i}`}
                    />
                  ))}
                </div>
              )}

              {summaryState === "done" && (
                <p className="post-summary-text">
                  {summary}
                </p>
              )}

              {summaryState === "error" && (
                <p className="post-summary-error">
                  {summaryError} — please try again.
                </p>
              )}
            </div>
          )}

          {/* ACTION ROW */}
          {submitError && (
            <p className="post-summary-error">
              {submitError}
            </p>
          )}

          <div className="post-action-row">
            <button
              onClick={() => router.back()}
              className="btnGhost post-action-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btnPrimary post-action-btn post-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="post-spinner">
                    ⟳
                  </span>
                  Posting…
                </>
              ) : (
                "Post Issue →"
              )}
            </button>
          </div>

        </div>
      </div>

    </main>
  );
}
