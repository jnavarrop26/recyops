import { Navigate } from "react-router";

export function RutaSuperAdmin({ children }: { children: React.ReactNode }) {
  const rol = (localStorage.getItem("sicofar_rol") || "").toUpperCase();
  if (rol !== "SUPERADMIN") {
    return <Navigate to="/inicio" replace />;
  }
  return <>{children}</>;
}
