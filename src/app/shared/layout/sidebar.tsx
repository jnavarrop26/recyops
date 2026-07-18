import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/modules/auth/authApi";
import { RecyOPSIcon } from "@/app/shared/components/recyops-icon";
import styles from "@/app/shared/layout/sidebar.module.css";

interface SubOpcion {
  ruta: string;
  etiqueta: string;
  soloAdmin?: boolean;
}

interface OpcionMenu {
  ruta: string;
  etiqueta: string;
  etiquetaPrincipal?: string;
  subopciones?: SubOpcion[];
  soloAdmin?: boolean;
  soloSuperAdmin?: boolean;
  /** Solo el enlace principal del grupo es de admin; las subopciones se filtran aparte. */
  principalSoloAdmin?: boolean;
}

/** Opción ya filtrada por rol, lista para pintar. */
interface OpcionRenderizable {
  opcion: OpcionMenu;
  mostrarPrincipal: boolean;
}

interface SeccionMenu {
  etiqueta?: string;
  opciones: OpcionMenu[];
}

/**
 * El menú se organiza por secciones que reflejan cómo trabaja la operación:
 * lo diario arriba, la administración en el medio y el sistema al final.
 * Una sección sin opciones visibles para el rol actual no se pinta.
 */
const secciones: SeccionMenu[] = [
  {
    opciones: [
      { ruta: "/plataforma", etiqueta: "Empresas", soloSuperAdmin: true },
      { ruta: "/inicio", etiqueta: "Inicio" },
      {
        // Todo lo del equipo vive bajo Trabajadores: el principal es la vista
        // de trabajadores (admin) y las tareas cuelgan como subopciones.
        ruta: "/trabajadores",
        etiqueta: "Trabajadores",
        principalSoloAdmin: true,
        subopciones: [
          { ruta: "/tareas", etiqueta: "Tareas", soloAdmin: true },
          { ruta: "/mis-tareas", etiqueta: "Mis tareas" },
        ],
      },
    ],
  },
  {
    etiqueta: "Operación",
    opciones: [
      {
        ruta: "/ingreso",
        etiqueta: "Ingreso",
        etiquetaPrincipal: "Registrar ingreso",
        subopciones: [{ ruta: "/ingreso/historial", etiqueta: "Historial de ingresos" }],
      },
      {
        ruta: "/entregas",
        etiqueta: "Entregas",
        etiquetaPrincipal: "Registrar entrega",
        soloAdmin: true,
        subopciones: [{ ruta: "/entregas/historial", etiqueta: "Historial de entregas" }],
      },
      { ruta: "/inventario", etiqueta: "Inventario", soloAdmin: true },
      { ruta: "/bodegas", etiqueta: "Bodegas", soloAdmin: true },
    ],
  },
  {
    etiqueta: "Administración",
    opciones: [
      { ruta: "/materiales", etiqueta: "Materiales", soloAdmin: true },
      { ruta: "/proveedores", etiqueta: "Proveedores", soloAdmin: true },
      { ruta: "/convenios", etiqueta: "Convenios", soloAdmin: true },
    ],
  },
  {
    etiqueta: "Sistema",
    opciones: [
      { ruta: "/reportes", etiqueta: "Reportes", soloAdmin: true },
      { ruta: "/logs", etiqueta: "Logs", soloAdmin: true },
      { ruta: "/configuracion", etiqueta: "Configuración" },
      { ruta: "/servicios-externos", etiqueta: "Servicios externos", soloAdmin: true },
    ],
  },
];

function esAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "ADMIN";
}

function esSuperAdmin(): boolean {
  return (localStorage.getItem("sicofar_rol") || "").toUpperCase() === "SUPERADMIN";
}

function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function GrupoConSubmenu({
  opcion,
  mostrarPrincipal,
  onNavegar,
}: {
  opcion: OpcionMenu;
  mostrarPrincipal: boolean;
  onNavegar?: () => void;
}) {
  const ubicacion = useLocation();
  // El grupo arranca abierto si la ruta actual es la principal o una subopción.
  const rutasDelGrupo = [opcion.ruta, ...(opcion.subopciones ?? []).map((sub) => sub.ruta)];
  const rutaActivaEnGrupo = rutasDelGrupo.some((ruta) => ubicacion.pathname.startsWith(ruta));
  const [abierto, setAbierto] = useState(rutaActivaEnGrupo);

  return (
    <div className={styles.grupo}>
      <button
        type="button"
        className={styles.botonGrupo}
        aria-expanded={abierto}
        onClick={() => setAbierto((previo) => !previo)}
      >
        <span>{opcion.etiqueta}</span>
        <span className={`${styles.flecha} ${abierto ? styles.flechaAbierta : ""}`}>›</span>
      </button>

      {abierto && (
        <div className={styles.submenu}>
          {mostrarPrincipal && (
            <NavLink
              to={opcion.ruta}
              end
              onClick={onNavegar}
              className={({ isActive }) =>
                isActive ? `${styles.subLink} ${styles.subActivo}` : styles.subLink
              }
            >
              {opcion.etiquetaPrincipal ?? opcion.etiqueta}
            </NavLink>
          )}
          {opcion.subopciones?.map((sub) => (
            <NavLink
              key={sub.ruta}
              to={sub.ruta}
              onClick={onNavegar}
              className={({ isActive }) =>
                isActive ? `${styles.subLink} ${styles.subActivo}` : styles.subLink
              }
            >
              {sub.etiqueta}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  /** En móvil controla el panel off-canvas; en escritorio no tiene efecto. */
  abierto?: boolean;
  /** Se invoca al navegar, para que el layout cierre el menú en móvil. */
  onNavegar?: () => void;
}

export function Sidebar({ abierto = false, onNavegar }: SidebarProps) {
  const navigate = useNavigate();
  const admin = esAdmin();
  const superAdmin = esSuperAdmin();

  const nombre = localStorage.getItem("sicofar_nombre") ?? "Usuario";
  const rol = (localStorage.getItem("sicofar_rol") ?? "OPERARIO").toUpperCase();
  const iniciales = obtenerIniciales(nombre) || "U";

  const visible = (o: { soloAdmin?: boolean; soloSuperAdmin?: boolean }) => {
    if (o.soloSuperAdmin) return superAdmin;
    if (superAdmin) return false;
    if (o.soloAdmin) return admin;
    return true;
  };

  // Aplica el rol a cada opción; en los grupos filtra también sus subopciones
  // y decide si el enlace principal se muestra.
  const filtrar = (o: OpcionMenu): OpcionRenderizable | null => {
    if (!o.subopciones) return visible(o) ? { opcion: o, mostrarPrincipal: true } : null;
    // Grupos: superadmin no ve los grupos operativos y soloAdmin oculta el grupo completo.
    if (superAdmin && !o.soloSuperAdmin) return null;
    if (o.soloAdmin && !admin) return null;
    const subopciones = o.subopciones.filter(visible);
    const mostrarPrincipal = !o.principalSoloAdmin || admin;
    if (!mostrarPrincipal && subopciones.length === 0) return null;
    return { opcion: { ...o, subopciones }, mostrarPrincipal };
  };

  const seccionesVisibles = secciones
    .map((s) => ({
      ...s,
      opciones: s.opciones
        .map(filtrar)
        .filter((o): o is OpcionRenderizable => o !== null),
    }))
    .filter((s) => s.opciones.length > 0);

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <aside className={`${styles.sidebar} ${abierto ? styles.abierta : ""}`}>
      <div className={styles.brand}>
        <div className={styles.brandRow}>
          <RecyOPSIcon size={28} variant="light" />
          <div className={styles.brandName}>RecyOPS</div>
        </div>
        <div className={styles.brandTag}>Bodegas de Reciclaje</div>
      </div>

      <nav className={styles.nav}>
        {seccionesVisibles.map((seccion, indice) => (
          <div key={seccion.etiqueta ?? indice} className={styles.seccion}>
            {seccion.etiqueta && <div className={styles.seccionTitulo}>{seccion.etiqueta}</div>}
            {seccion.opciones.map(({ opcion, mostrarPrincipal }) =>
              opcion.subopciones ? (
                <GrupoConSubmenu
                  key={opcion.ruta}
                  opcion={opcion}
                  mostrarPrincipal={mostrarPrincipal}
                  onNavegar={onNavegar}
                />
              ) : (
                <NavLink
                  key={opcion.ruta}
                  to={opcion.ruta}
                  onClick={onNavegar}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  {opcion.etiqueta}
                </NavLink>
              ),
            )}
          </div>
        ))}
      </nav>

      <div className={styles.perfil}>
        <div className={styles.avatar} title={nombre}>
          {iniciales}
        </div>
        <div className={styles.perfilInfo}>
          <span className={styles.perfilNombre}>{nombre}</span>
          <span className={styles.perfilRol}>{rol}</span>
        </div>
        <button type="button" className={styles.botonSalir} onClick={salir} title="Cerrar sesión">
          <LogOut size={15} aria-hidden="true" />
          <span className={styles.soloLector}>Cerrar sesión</span>
        </button>
      </div>

      <div className={styles.footer}>
        <RecyOPSIcon size={14} variant="light" />
        RecyOPS © 2023 — 2026
      </div>
    </aside>
  );
}
