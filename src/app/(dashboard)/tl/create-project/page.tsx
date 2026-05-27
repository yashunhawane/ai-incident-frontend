"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Employee, getEmployees } from '../../../../lib/employees';
import { createProject } from '../../../../lib/project';

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "8px",
  border: "0.5px solid var(--airis-border)",
  background: "rgba(255,255,255,0.03)",
  padding: "10px 14px",
  fontSize: 13,
  color: "#ededed",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(232,234,246,0.4)",
  marginBottom: "0.5rem",
};

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employee, setEmployee] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getEmployees();
        setEmployees(data);
        setEmployee(data[0]?._id ?? "");
      } catch (error) {
        setEmployeesError(error instanceof Error ? error.message : "Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    }

    loadEmployees();
  }, []);

  const addMember = () => {
    if (employee && !selectedMembers.includes(employee)) {
      setSelectedMembers((current) => [...current, employee]);
    }
  };

  const removeMember = (member: string) => {
    setSelectedMembers((current) => current.filter((item) => item !== member));
  };

  const getEmployeeLabel = (employeeId: string) => {
    const match = employees.find((item) => item._id === employeeId);
    return match ? `${match.name} (${match.email})` : employeeId;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const title = name.trim();
    if (!title) {
      setSubmitError("Project name is required.");
      return;
    }

    setSaving(true);

    try {
      await createProject({
        title,
        description: description.trim(),
        members: selectedMembers,
      });
      setName("");
      setDescription("");
      setSelectedMembers([]);
      setSubmitSuccess("Project saved successfully.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pageMain">
      <div className="contentWrap">
        <div className="section" style={{ maxWidth: 680, paddingTop: "2.5rem" }}>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div>
              <p className="sectionTag">New Project</p>
              <h1 className="sectionTitle" style={{ marginBottom: 0 }}>Create Project</h1>
            </div>
            <Link
              href="/tl"
              className="btnGhost"
              style={{ textDecoration: "none", borderRadius: "8px", fontSize: 13 }}
            >
              ← Back
            </Link>
          </div>

          {/* Form Card */}
          <div
            style={{
              borderRadius: "14px",
              border: "0.5px solid var(--airis-border)",
              background: "rgba(255,255,255,0.02)",
              padding: "2rem",
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Project Name */}
              <div>
                <label style={labelStyle}>Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short project description"
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Add Members */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "0.5px solid var(--airis-border)",
                  background: "rgba(0,115,255,0.03)",
                  padding: "1.25rem",
                }}
              >
                <p style={{ ...labelStyle, marginBottom: "1rem" }}>Add Members</p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <select
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    disabled={loadingEmployees || employees.length === 0}
                    style={{ ...inputStyle, flex: 1, minWidth: 180, cursor: loadingEmployees || employees.length === 0 ? "not-allowed" : "pointer" }}
                  >
                    {loadingEmployees ? (
                      <option value="">Loading employees...</option>
                    ) : employees.length === 0 ? (
                      <option value="">No employees found</option>
                    ) : (
                      employees.map((item) => (
                        <option key={item._id} value={item._id} style={{ background: "#04060f" }}>
                          {item.name} ({item.email})
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={addMember}
                    disabled={loadingEmployees || !employee}
                    className="btnPrimary"
                    style={{ borderRadius: "8px", whiteSpace: "nowrap" }}
                  >
                    + Add
                  </button>
                </div>
                {employeesError && (
                  <p style={{ color: "#f66", marginTop: "0.75rem", fontSize: 12 }}>
                    {employeesError}
                  </p>
                )}

                {selectedMembers.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ ...labelStyle, marginBottom: "0.6rem" }}>Selected</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedMembers.map((member) => (
                        <div
                          key={member}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: "8px",
                            background: "rgba(255,255,255,0.03)",
                            border: "0.5px solid var(--airis-border)",
                            padding: "8px 12px",
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#ededed" }}>- {getEmployeeLabel(member)}</span>
                          <button
                            type="button"
                            onClick={() => removeMember(member)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              color: "rgba(232,234,246,0.4)",
                              padding: 0,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(submitError || submitSuccess) && (
                <p
                  style={{
                    color: submitError ? "#f66" : "rgba(77,212,160,0.95)",
                    fontSize: 12,
                    margin: 0,
                  }}
                >
                  {submitError ?? submitSuccess}
                </p>
              )}

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btnPrimary"
                  style={{
                    borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Project"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
