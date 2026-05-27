"use client";

import Nav from "../components/Nav";
import DashboardAuthGuard from "../components/DashboardAuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <div className="pageMain">
        <div className="contentWrap">
          <Nav />
          {children}
        </div>
      </div>
    </DashboardAuthGuard>
  );
}