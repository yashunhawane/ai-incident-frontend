"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects, type Project, type ProjectMember } from "../../../lib/project";

function getMemberKey(member: ProjectMember) {
  return typeof member === "string" ? member : member._id ?? member.id ?? member.email ?? member.name ?? "member";
}

function getMemberLabel(member: ProjectMember) {
  if (typeof member === "string") return member;
  if (member.name && member.email) return `${member.name} (${member.email})`;
  return member.name ?? member.email ?? member._id ?? member.id ?? "Team member";
}

export default function TLPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        setProjectsError(error instanceof Error ? error.message : "Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    }

    loadProjects();
  }, []);

  return (
    <main className="pageMain">
      <div className="contentWrap">
        <div className="section" style={{ paddingTop: "2.5rem" }}>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem",
              padding: "1.5rem 2rem",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid var(--airis-border)",
            }}
          >
            <div>
              <p className="sectionTag">Team Lead Dashboard</p>
              <h1 className="sectionTitle" style={{ marginBottom: 0 }}>Projects</h1>
            </div>
            <Link href="/tl/create-project" className="btnPrimary" style={{ textDecoration: "none", borderRadius: "8px" }}>
              + Create Project
            </Link>
          </div>

          {/* Project Cards */}
          {loadingProjects ? (
            <p style={{ fontSize: 13, color: "rgba(232,234,246,0.5)" }}>Loading projects...</p>
          ) : projectsError ? (
            <p style={{ fontSize: 13, color: "#f66" }}>{projectsError}</p>
          ) : projects.length === 0 ? (
            <p style={{ fontSize: 13, color: "rgba(232,234,246,0.5)" }}>No projects found.</p>
          ) : (
            <div className="rolesGrid">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  href={`/projects/${project._id}`}
                  className="roleCard roleCardLead projectCardLink"
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <p className="roleName" style={{ marginBottom: "0.4rem" }}>{project.title}</p>
                      <p style={{ fontSize: 13, color: "rgba(232,234,246,0.5)", lineHeight: 1.6 }}>{project.description || "No description provided."}</p>
                    </div>
                    <span className="pill" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                      {project.members.length} members
                    </span>
                  </div>

                  <div style={{ borderTop: "0.5px solid var(--airis-border)", paddingTop: "1rem" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(232,234,246,0.35)", marginBottom: "0.6rem" }}>
                      Team
                    </p>
                    {project.members.length > 0 ? (
                      <ul className="roleList">
                        {project.members.map((member) => (
                          <li key={getMemberKey(member)} className="roleItem">
                            <span className="roleArrow" style={{ color: "var(--airis-blue-l)" }}>-&gt;</span>
                            {getMemberLabel(member)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: 13, color: "rgba(232,234,246,0.45)", margin: 0 }}>No members assigned.</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
