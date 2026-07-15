import { Navigate } from "react-router";

export function RutaAdmin({ children }: { children: React.ReactNode }) {
  const rol = (localStorage.getItem("sicofar_rol") || "").toUpperCase();
  if (rol !== "ADMIN") {
    return <Navigate to="/ingreso" replace />;
  }
  return <>{children}</>;
}
