"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, type User } from "../../../lib/auth";
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

export default function LoginPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; global?: string }>({});
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) {
      router.replace(getDashboardForRole(stored.user.role));
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  function validate() {
    const errs: typeof errors = {};
    if (!formData.email || !formData.email.includes("@"))
      errs.email = "Please enter a valid email address.";
    if (!formData.password || formData.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
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

      const data = await loginUser(formData);

      // persist to localStorage for session persistence
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      // store login response in Redux for use across the app
      dispatch(
        setCredentials({
          token: data.token,
          user: data.user,
        })
      );

      if (data.user.role === "teamlead") {
        router.replace("/tl");
      } else {
        router.replace("/employee");
      }
    } catch (error) {
      setErrors({
        global:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pageMain">
      {/* Ambient glows */}
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,115,255,0.08) 0%, transparent 70%)",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(77,212,160,0.05) 0%, transparent 70%)",
          bottom: 60,
          right: -60,
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
            No account?{" "}
            <Link href="/register" className="navLink" style={{ color: "var(--airis-blue-l)" }}>
              Register →
            </Link>
          </p>
        </nav>

        {/* Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 65px)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid var(--airis-border)",
              borderRadius: 16,
              padding: "2.25rem 2rem",
            }}
          >
            {/* Badge */}
            <div className="badge" style={{ marginBottom: "1.25rem" }}>
              <span className="badgeDot" />
              Secure Access
            </div>

            <h1
              style={{
                fontFamily: "'Syne', 'Space Grotesk', sans-serif",
                fontSize: "1.65rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                marginBottom: "0.35rem",
                lineHeight: 1.15,
              }}
            >
              Welcome back
            </h1>
            <p className="heroSub" style={{ fontSize: 13, marginBottom: "1.75rem" }}>
              Sign in to your AIRIS workspace to continue.
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
              {/* Email */}
              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(232,234,246,0.4)",
                    marginBottom: "0.45rem",
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: errors.email
                      ? "rgba(255,60,60,0.05)"
                      : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${errors.email ? "rgba(255,60,60,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#ededed",
                    outline: "none",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
                {errors.email && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,80,80,0.85)",
                      marginTop: 4,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(232,234,246,0.4)",
                    marginBottom: "0.45rem",
                  }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, password: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: errors.password
                      ? "rgba(255,60,60,0.05)"
                      : "rgba(255,255,255,0.03)",
                    border: `0.5px solid ${errors.password ? "rgba(255,60,60,0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#ededed",
                    outline: "none",
                    fontFamily: "Arial, sans-serif",
                  }}
                />
                {errors.password && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,80,80,0.85)",
                      marginTop: 4,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {errors.password}
                  </span>
                )}
              </div>

              <div style={{ textAlign: "right", marginBottom: "1.25rem" }}>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: 11,
                    color: "rgba(77,127,255,0.75)",
                    fontFamily: "'JetBrains Mono', monospace",
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btnPrimary"
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              <div style={{ flex: 1, height: "0.5px", background: "var(--airis-border)" }} />
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(232,234,246,0.25)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: "0.5px", background: "var(--airis-border)" }} />
            </div>

            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(232,234,246,0.4)", margin: 0 }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "var(--airis-blue-l)", textDecoration: "none" }}>
                Create one →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
