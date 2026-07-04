
///
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.main}>
        <Navbar onMenuClick={() => setSidebarOpen((p) => !p)} />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
