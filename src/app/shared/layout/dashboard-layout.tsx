import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "@/app/shared/layout/sidebar";
import { RecyOPSIcon } from "@/app/shared/components/recyops-icon";
import styles from "@/app/shared/layout/dashboard-layout.module.css";

export function DashboardLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  // Cambiar de ruta siempre cierra el menú móvil.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Escape cierra el menú móvil.
  useEffect(() => {
    if (!menuAbierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setMenuAbierto(false);
    }
    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [menuAbierto]);

  // Sin sesión activa no hay dashboard: de vuelta al login.
  if (!localStorage.getItem("sicofar_token")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.shell}>
      {/* Barra visible solo en móvil: abre el menú off-canvas */}
      <header className={styles.barraMovil}>
        <button
          type="button"
          className={styles.botonMenu}
          aria-label="Abrir menú"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(true)}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <RecyOPSIcon size={20} variant="default" />
        <span className={styles.marcaMovil}>RecyOPS</span>
      </header>

      {menuAbierto && (
        <div
          className={styles.overlay}
          role="presentation"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <div className={styles.body}>
        <Sidebar abierto={menuAbierto} onNavegar={() => setMenuAbierto(false)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
