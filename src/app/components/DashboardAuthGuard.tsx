"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { ReactNode } from "react";
import type { User } from "../../lib/auth";
import type { AppDispatch, RootState } from "../../store/store";
import { setCredentials, clearCredentials } from "../../store/authSlice";

const STORAGE_TOKEN = "token";
const STORAGE_USER = "user";

const PUBLIC_ROUTES = ["/login", "/register"];
const HOME_ROUTES = ["/", "/home"];

const ROLE_ROUTES: Record<string, string> = {
  "/tl": "teamlead",
  "/employee": "employee",
};

function getStoredAuth(): { token: string; user: User } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(STORAGE_TOKEN);
  const rawUser = localStorage.getItem(STORAGE_USER);
  if (!token || !rawUser) return null;
  try {
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
    return null;
  }
}

function clearStoredAuth() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

function getDashboardForRole(role: string) {
  return role === "teamlead" ? "/tl" : "/employee";
}

export default function DashboardAuthGuard({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const reduxToken = useSelector((state: RootState) => state.auth.token);

  // Synchronously resolve auth on first render using a ref
  // This avoids the one-frame delay that lets the back-navigated page flash
  const storedAuthRef = useRef<{ token: string; user: User } | null>(
    typeof window !== "undefined" ? getStoredAuth() : null
  );

  const [hydrated, setHydrated] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Step 1 — Hydrate Redux from localStorage once on mount
  useEffect(() => {
    const stored = storedAuthRef.current;

    if (stored && !reduxToken) {
      dispatch(setCredentials(stored));
    } else if (!stored && reduxToken) {
      dispatch(clearCredentials());
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 — Route guard: runs on every pathname/auth change after hydration
  useEffect(() => {
    if (!hydrated) return;

    // Always re-read from storage in case it changed (e.g. logout in another tab)
    const stored = getStoredAuth();
    const token = reduxToken ?? stored?.token ?? null;
    const user = reduxUser ?? stored?.user ?? null;
    const isLoggedIn = !!(token && user);

    const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname?.startsWith(r + "/"));
    const isHomeRoute = HOME_ROUTES.some((r) => pathname === r);

    // ── Logged-in user hitting home, login, or register ──
    // Uses replace() so these pages are NOT in the history stack anymore.
    // Back button will skip past them entirely.
    if (isLoggedIn && (isPublicRoute || isHomeRoute)) {
      setRedirecting(true);
      router.replace(getDashboardForRole(user!.role));
      return;
    }

    // ── Logged-out user hitting a protected route ──
    if (!isLoggedIn && !isPublicRoute && !isHomeRoute) {
      clearStoredAuth();
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    // ── Logged-in user on wrong role's route ──
    if (isLoggedIn && user) {
      for (const [prefix, requiredRole] of Object.entries(ROLE_ROUTES)) {
        if (pathname?.startsWith(prefix) && user.role !== requiredRole) {
          setRedirecting(true);
          router.replace(getDashboardForRole(user.role));
          return;
        }
      }
    }

    // No redirect needed — clear any leftover redirecting flag
    setRedirecting(false);
  }, [hydrated, reduxToken, reduxUser, pathname, router]);

  // ── Render gate ──

  // Still checking localStorage on first paint — show nothing
  if (!hydrated) return null;

  // A redirect was triggered — show nothing until navigation completes
  if (redirecting) return null;

  // Re-read for the render decision
  const stored = getStoredAuth();
  const token = reduxToken ?? stored?.token ?? null;
  const user = reduxUser ?? stored?.user ?? null;
  const isLoggedIn = !!(token && user);

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r || pathname?.startsWith(r + "/"));
  const isHomeRoute = HOME_ROUTES.some((r) => pathname === r);

  // Public/home routes: only render if NOT logged in
  if ((isPublicRoute || isHomeRoute) && !isLoggedIn) return <>{children}</>;

  // Protected routes: only render if logged in
  if (!isPublicRoute && !isHomeRoute && isLoggedIn) return <>{children}</>;

  // Catch-all: redirect is about to fire, render nothing
  return null;
}