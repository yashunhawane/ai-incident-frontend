"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { getPosts, type Post } from "@/src/lib/post";
import { getProject, type ProjectDetail } from "@/src/lib/project";
import type { RootState } from "@/src/store/store";

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!projectId) return;

    let ignore = false;

    Promise.all([getProject(projectId), getPosts(projectId)])
      .then(([projectData, postsData]) => {
        if (ignore) return;
        setProject(projectData);
        setPosts(postsData);
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch project"
        );
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <main className="pageMain">
        <div className="pd-page">
          <p className="pd-loading">Loading project...</p>
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="pageMain">
        <div className="pd-page">
          <p className="pd-error">{error || "Project not found."}</p>
        </div>
      </main>
    );
  }

  const projectName = project.title ?? project.name ?? "Untitled Project";
  const dashboardPath = user?.role === "teamlead" ? "/tl" : "/employee";
  const handleAddPost = () => {
    const params = new URLSearchParams({
      projectName,
      projectStatus: project.status,
      teamLeadName: project.teamLead.name,
    });

    router.push(`/projects/${projectId}/posts?${params.toString()}`);
  };

  return (
    <main className="pageMain">
      <div className="pd-page">

        {/* Back button */}
        <button className="pd-back" onClick={() => router.push(dashboardPath)}>
          ← Back to Projects
        </button>

        {/* Project header card */}
        <div className="pd-header-card">
          <div className="pd-top-row">
            <h1 className="pd-project-name">{project.title ?? project.name}</h1>
            <span className={`pd-status-badge ${project.status === "active" ? "pd-status-active" : "pd-status-closed"}`}>
              <span className="pd-status-dot" />
              {project.status === "active" ? "Active" : "Closed"}
            </span>
          </div>

          <p className="pd-description">{project.description}</p>

          <div className="pd-divider" />

          <div className="pd-lead-row">
            <div className="pd-avatar">
              {(project.teamLead.name)}
            </div>
            <div>
              <div className="pd-lead-label">Team Lead</div>
              <div className="pd-lead-name">{project.teamLead.name}</div>
            </div>
          </div>
        </div>

        {/* Posts section */}
        <div className="pd-posts-section">
          <div className="pd-posts-header">
            <h2 className="pd-posts-title">Posts</h2>
            <button
              className="pd-add-btn"
              onClick={handleAddPost}
            >
              <span className="pd-plus">+</span> Add Post
            </button>
          </div>

          {posts.length === 0 ? (
            <div className="pd-empty">
              <div className="pd-empty-icon">📋</div>
              <p>No posts yet.</p>
              <p>Be the first to report an issue.</p>
            </div>
          ) : (
            <div className="pd-post-list">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="pd-post-card"
                  onClick={() => router.push(`/projects/${projectId}/posts/${post._id}`)}
                >
                  <div className="pd-post-left">
                    <div className="pd-post-icon">🐛</div>
                    <div className="pd-post-info">
                      <div className="pd-post-name">
                        {post.title ?? post.aiSummary ?? post.description}
                      </div>
                      <div className="pd-post-author">
                        Posted by{" "}
                        <span>
                          {post.createdBy?.name ??
                            (typeof post.reportedBy === "object"
                              ? post.reportedBy.name
                              : null) ??
                            "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pd-post-arrow">›</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
