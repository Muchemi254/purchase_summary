// components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { Menu, Plus, List } from 'lucide-react';

export default function Sidebar({ page, setPage }) {
  const [open, setOpen] = useState(true);

  const linkBase =
    "flex items-center gap-3 px-4 py-2 rounded cursor-pointer hover:bg-gray-200";
  const active =
    "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <div className="relative">
      {/* Toggle button (mobile) */}
      <button
        className="md:hidden p-2 m-2 rounded bg-gray-200"
        onClick={() => setOpen(!open)}
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full bg-white shadow-lg md:shadow-none w-60 p-4 transition-transform 
          ${open ? "translate-x-0" : "-translate-x-64"} md:translate-x-0 z-20`}
      >
        <h1 className="text-xl font-bold mb-6 px-2">Purchase Tracker</h1>

        <nav className="space-y-2">
          <div
            className={`${linkBase} ${page === "add" ? active : ""}`}
            onClick={() => setPage("add")}
          >
            <Plus size={20} />
            <span>Add Record</span>
          </div>

          <div
            className={`${linkBase} ${page === "view" ? active : ""}`}
            onClick={() => setPage("view")}
          >
            <List size={20} />
            <span>View Records</span>
          </div>
        </nav>
      </aside>
    </div>
  );
}


