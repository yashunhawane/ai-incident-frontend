'use client'
import React from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState, AppDispatch } from "../../store/store";
import { clearCredentials } from "../../store/authSlice";

export default function Nav() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  function handleLogout() {
    dispatch(clearCredentials());
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    router.replace("/login");
  }

  return (
    <nav className="nav">
      <Link href="/" className="logo logoLink" aria-label="AIRIS home">
        <span className="logoDot" />
        AIRIS
      </Link>

      {user ? (
        <div className="navUser">
          <div className="navAvatar">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div className="navUserInfo">
            <span className="navUserName">
              {user.name}
            </span>
            <span className="navUserRole">{user.role === "teamlead" ? "Team Lead" : "Employee"}</span>
          </div>
          <button className="navCta" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <a href="/login" className="navCta">Get started →</a>
      )}
    </nav>
  );
}
