import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "@/app/shared/layout/sidebar";
import { RecyOPSIcon } from "@/app/shared/components/recyops-icon";
import styles from "@/app/shared/layout/dashboard-layout.module.css";

export function DashboardLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const botonMenuRef = useRef<HTMLButtonElement>(null);

  // Cierra el menú móvil devolviendo el foco al botón que lo abrió
  // (Escape, overlay o el propio botón).
  function cerrarMenuConFoco() {
    setMenuAbierto(false);
    botonMenuRef.current?.focus();
  }

  // Cambiar de ruta siempre cierra el menú móvil.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Al abrir el menú móvil, el foco entra al primer enlace del menú.
  useEffect(() => {
    if (!menuAbierto) return;
    const frame = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>("#menu-lateral a[href], #menu-lateral button")
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [menuAbierto]);

  // Escape cierra el menú móvil.
  useEffect(() => {
    if (!menuAbierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setMenuAbierto(false);
        botonMenuRef.current?.focus();
      }
    }
    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [menuAbierto]);

  // Sin sesión activa no hay dashboard: de vuelta al login, recordando la
  // ruta pedida para volver a ella después de iniciar sesión.
  if (!localStorage.getItem("recyops_token")) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return (
    <div className={styles.shell}>
      {/* Barra visible solo en móvil: abre el menú off-canvas */}
      <header className={styles.barraMovil}>
        <button
          type="button"
          ref={botonMenuRef}
          className={styles.botonMenu}
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          aria-controls="menu-lateral"
          onClick={() => (menuAbierto ? cerrarMenuConFoco() : setMenuAbierto(true))}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <RecyOPSIcon size={20} variant="default" />
        <span className={styles.marcaMovil}>RecyOPS</span>
      </header>

      <div
        className={`${styles.overlay} ${menuAbierto ? styles.overlayVisible : ""}`}
        role="presentation"
        aria-hidden="true"
        onClick={cerrarMenuConFoco}
      />

      <div className={styles.body}>
        <Sidebar abierto={menuAbierto} onNavegar={() => setMenuAbierto(false)} />
        <main className={styles.content}>
          <div className={styles.contenido}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
