import { createBrowserRouter, Navigate } from "react-router";
import { LoginScreen } from "@/app/modules/auth/login-screen";
import { RestablecerScreen } from "@/app/modules/auth/restablecer-screen";
import { DashboardLayout } from "@/app/shared/layout/dashboard-layout";
import { HomeView } from "@/app/modules/home/home-view";
import { TareasVista } from "@/app/modules/tareas/tareas-vista";
import { MisTareasVista } from "@/app/modules/tareas/mis-tareas-vista";
import { HistorialIngresos } from "@/app/modules/ingresos/historial-ingresos";
import { TrabajadoresVista } from "@/app/modules/trabajadores/trabajadores-vista";
import { MaterialesVista } from "@/app/modules/materiales/materiales-vista";
import { BodegasVista } from "@/app/modules/bodega/bodegas-vista";
import { BodegaDetalle } from "@/app/modules/bodega/bodega-detalle";
import { ProveedoresVista } from "@/app/modules/proveedores/proveedores-vista";
import { InventarioVista } from "@/app/modules/inventario/inventario-vista";
import { InventarioDetalle } from "@/app/modules/inventario/inventario-detalle";
import { EntregasVista } from "@/app/modules/entregas/entregas-vista";
import { EntregaDetalle } from "@/app/modules/entregas/entrega-detalle";
import { HistorialEntregasVista } from "@/app/modules/entregas/historial-entregas-vista";
import { RutaAdmin } from "@/app/shared/layout/ruta-admin";
import { RutaSuperAdmin } from "@/app/shared/layout/ruta-super-admin";
import { PlataformaVista } from "@/app/modules/platform/plataforma-vista";
import {
  IngresoPage,
  ConveniosPage,
  LogsPage,
  ConfiguracionPage,
  ReportesPage,
  ServiciosExternosPage,
} from "@/app/shared/components/pages";

function Admin({ children }: { children: React.ReactNode }) {
  return <RutaAdmin>{children}</RutaAdmin>;
}

function SuperAdmin({ children }: { children: React.ReactNode }) {
  return <RutaSuperAdmin>{children}</RutaSuperAdmin>;
}

export const router = createBrowserRouter([
  { path: "/", Component: LoginScreen },
  { path: "/restablecer", Component: RestablecerScreen },
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { path: "inicio", Component: HomeView },
      { path: "tareas", element: <Admin><TareasVista /></Admin> },
      { path: "mis-tareas", Component: MisTareasVista },
      { path: "ingreso", Component: IngresoPage },
      { path: "ingreso/historial", Component: HistorialIngresos },
      { path: "trabajadores", element: <Admin><TrabajadoresVista /></Admin> },
      { path: "materiales", element: <Admin><MaterialesVista /></Admin> },
      { path: "bodegas", element: <Admin><BodegasVista /></Admin> },
      { path: "bodegas/:id", element: <Admin><BodegaDetalle /></Admin> },
      { path: "proveedores", element: <Admin><ProveedoresVista /></Admin> },
      { path: "inventario", element: <Admin><InventarioVista /></Admin> },
      { path: "inventario/:id", element: <Admin><InventarioDetalle /></Admin> },
      { path: "entregas", element: <Admin><EntregasVista /></Admin> },
      { path: "entregas/historial", element: <Admin><HistorialEntregasVista /></Admin> },
      { path: "entregas/:id", element: <Admin><EntregaDetalle /></Admin> },
      { path: "convenios", element: <Admin><ConveniosPage /></Admin> },
      { path: "reportes", element: <Admin><ReportesPage /></Admin> },
      { path: "logs", element: <Admin><LogsPage /></Admin> },
      { path: "plataforma", element: <SuperAdmin><PlataformaVista /></SuperAdmin> },
      { path: "configuracion", Component: ConfiguracionPage },
      { path: "servicios-externos", element: <Admin><ServiciosExternosPage /></Admin> },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
