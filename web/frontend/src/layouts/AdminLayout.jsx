import React from "react";
import AdminSidebar from "../components/layouts/AdminSidebar";
import AdminTopBar from "../components/layouts/AdminTopBar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      {/* Sidebar */}
      <AdminSidebar />
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
