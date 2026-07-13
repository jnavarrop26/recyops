import { Navigate, Outlet } from "react-router";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import styles from "./dashboard-layout.module.css";

export function DashboardLayout() {
  // Sin sesión activa no hay dashboard: de vuelta al login.
  if (!localStorage.getItem("sicofar_token")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.shell}>
      <Topbar />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
