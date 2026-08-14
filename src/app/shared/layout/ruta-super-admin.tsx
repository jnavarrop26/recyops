import { Navigate } from "react-router";

export function RutaSuperAdmin({ children }: { children: React.ReactNode }) {
  const rol = (localStorage.getItem("recyops_rol") || "").toUpperCase();
  if (rol !== "SUPERADMIN") {
    return <Navigate to="/inicio" replace />;
  }
  return <>{children}</>;
}
