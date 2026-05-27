"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, type RegisterPayload, type User } from "../../../lib/auth";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../store/authSlice";
import type { AppDispatch } from "../../../store/store";

function getStoredAuth(): { token: string; user: User } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  const rawUser = localStorage.getItem("user");
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }
}

function getDashboardForRole(role: string) {
  return role === "teamlead" ? "/tl" : "/employee";
}

type Role = "teamlead" | "employee" | null;

interface FormData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  global?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [ready, setReady] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: null,
  });
  const dispatch = useDispatch<AppDispatch>();
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);



  if (!ready) return null;

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = "Required.";
    if (!formData.email || !formData.email.includes("@"))
      errs.email = "Enter a valid email address.";
    if (!formData.password || formData.password.length < 6)
      errs.password = "Minimum 6 characters required.";
    if (!formData.role) errs.role = "Please select a role to continue.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payload: RegisterPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as Exclude<Role, null>,
      };

      const data = await registerUser(payload);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      // After successful registration we MUST send the user to /login.
      // Clear any just-created auth so DashboardAuthGuard will not redirect back to /tl or /employee.
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      dispatch(setCredentials({ token: "", user: data.user }));

      router.replace("/login");
    } catch (error) {
      setErrors({
        global:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    boxSizing: "border-box" as const,
    background: hasError ? "rgba(255,60,60,0.05)" : "rgba(255,255,255,0.03)",
    border: `0.5px solid ${hasError ? "rgba(255,60,60,0.4)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 8,
    padding: "9px 13px",
    fontSize: 13,
    color: "#ededed",
    outline: "none",
    fontFamily: "Arial, sans-serif",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgba(232,234,246,0.4)",
    marginBottom: "0.4rem",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "rgba(255,80,80,0.85)",
    marginTop: 4,
    display: "block",
    fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <main className="pageMain">
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(77,212,160,0.07) 0%, transparent 70%)",
          top: -80,
          right: -80,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,115,255,0.07) 0%, transparent 70%)",
          bottom: -50,
          left: -80,
          pointerEvents: "none",
        }}
      />

      <div className="contentWrap">
        {/* Nav */}
        <nav className="nav">
          <Link href="/" className="logo logoLink" aria-label="AIRIS home">
            <span className="logoDot" />
            AIRIS
          </Link>
          <p style={{ fontSize: 13, color: "rgba(232,234,246,0.5)", margin: 0 }}>
            Already have an account?{" "}
            <Link href="/login" className="navLink" style={{ color: "var(--airis-blue-l)" }}>
              Sign in →
            </Link>
          </p>
        </nav>

        {/* Card */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            minHeight: "calc(100vh - 65px)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid var(--airis-border)",
              borderRadius: 16,
              padding: "2rem",
            }}
          >
            {/* Badge */}
            <div
              className="badge"
              style={{
                marginBottom: "1.1rem",
                color: "var(--airis-green)",
                borderColor: "rgba(77,212,160,0.27)",
                background: "rgba(77,212,160,0.05)",
              }}
            >
              <span
                className="badgeDot"
                style={{ background: "var(--airis-green)" }}
              />
              New Account
            </div>

            <h1
              style={{
                fontFamily: "'Syne', 'Space Grotesk', sans-serif",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                marginBottom: "0.3rem",
                lineHeight: 1.15,
              }}
            >
              Create your account
            </h1>
            <p className="heroSub" style={{ fontSize: 13, marginBottom: "1.5rem" }}>
              Join AIRIS — track, report and resolve issues with AI-powered summaries.
            </p>

            {errors.global && (
              <div
                style={{
                  background: "rgba(255,60,60,0.08)",
                  border: "0.5px solid rgba(255,60,60,0.25)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "rgba(255,100,100,0.9)",
                  marginBottom: "1rem",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {errors.global}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full name */}
              <div style={{ marginBottom: "0.9rem" }}>
                <label htmlFor="name" style={labelStyle}>Full name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Arjun Mehta"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  style={inputStyle(!!errors.name)}
                />
                {errors.name && <span style={errorStyle}>{errors.name}</span>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: "0.9rem" }}>
                <label htmlFor="email" style={labelStyle}>Work email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  style={inputStyle(!!errors.email)}
                />
                {errors.email && <span style={errorStyle}>{errors.email}</span>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  style={inputStyle(!!errors.password)}
                />
                {errors.password && <span style={errorStyle}>{errors.password}</span>}
              </div>

              {/* Role selector */}
              <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>Select your role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "0.25rem" }}>
                {/* Team Lead card */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, role: "teamlead" }))}
                  className="roleCard"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.18s",
                    ...(formData.role === "teamlead"
                      ? {
                          background: "rgba(0,115,255,0.07)",
                          borderColor: "rgba(0,115,255,0.5)",
                        }
                      : {
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }),
                  }}
                >
                  <span
                    className="roleTag roleTagLead"
                    style={{ marginBottom: "0.6rem" }}
                  >
                    Team Lead
                  </span>
                  <p className="roleName" style={{ marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                    Team Lead
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(232,234,246,0.4)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Create projects, manage employees &amp; close issues
                  </p>
                </div>

                {/* Employee card */}
                <div
                  onClick={() => setFormData((p) => ({ ...p, role: "employee" }))}
                  className="roleCard"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.18s",
                    ...(formData.role === "employee"
                      ? {
                          background: "rgba(77,212,160,0.06)",
                          borderColor: "rgba(77,212,160,0.5)",
                        }
                      : {
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.1)",
                        }),
                  }}
                >
                  <span
                    className="roleTag roleTagEmp"
                    style={{ marginBottom: "0.6rem" }}
                  >
                    Employee
                  </span>
                  <p className="roleName" style={{ marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                    Employee
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "rgba(232,234,246,0.4)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Join projects, post issues &amp; collaborate with the team
                  </p>
                </div>
              </div>

              {errors.role && (
                <span style={{ ...errorStyle, marginBottom: "0.75rem" }}>{errors.role}</span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btnPrimary"
                style={{
                  width: "100%",
                  marginTop: "1rem",
                  marginBottom: "0.9rem",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(232,234,246,0.4)", margin: 0 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--airis-blue-l)", textDecoration: "none" }}>
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
