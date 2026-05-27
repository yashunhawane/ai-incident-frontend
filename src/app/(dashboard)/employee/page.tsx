"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { getEmployeeProjects, type Project, type ProjectMember } from "@/src/lib/project";

function getMemberName(member: ProjectMember) {
  if (typeof member === "string") return member;
  return member.name ?? member.email ?? member.id ?? member._id ?? "Unnamed member";
}

function getMemberKey(member: ProjectMember, index: number) {
  if (typeof member === "string") return member;
  return member._id ?? member.id ?? member.email ?? member.name ?? `member-${index}`;
}

export default function EmployeePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getEmployeeProjects()
      .then((nextProjects) => {
        if (!ignore) setProjects(nextProjects);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load projects");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="pageMain">
      <div className="contentWrap">
        <div className="section" style={{ paddingTop: "2.5rem" }}>
          {isLoading ? (
            <p style={{ color: "rgba(232,234,246,0.65)" }}>Loading projects...</p>
          ) : error ? (
            <p style={{ color: "var(--airis-pink)" }}>{error}</p>
          ) : projects.length === 0 ? (
            <p style={{ color: "rgba(232,234,246,0.65)" }}>No projects assigned.</p>
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
                      <p style={{ fontSize: 13, color: "rgba(232,234,246,0.5)", lineHeight: 1.6 }}>{project.description}</p>
                    </div>
                    <span className="pill" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                      {project.members.length} members
                    </span>
                  </div>

                  <div style={{ borderTop: "0.5px solid var(--airis-border)", paddingTop: "1rem" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(232,234,246,0.35)", marginBottom: "0.6rem" }}>
                      Team
                    </p>
                    <ul className="roleList">
                      {project.members.map((member, index) => (
                        <li key={getMemberKey(member, index)} className="roleItem">
                          <span className="roleArrow" style={{ color: "var(--airis-blue-l)" }}>-&gt;</span>
                          {getMemberName(member)}
                        </li>
                      ))}
                    </ul>
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
