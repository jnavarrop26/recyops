import { createBrowserRouter, Navigate } from "react-router";
import { LoginScreen } from "./components/login-screen";
import { RestablecerScreen } from "./components/restablecer-screen";
import { DashboardLayout } from "./components/dashboard-layout";
import { HomeView } from "./components/home-view";
import { TareasVista } from "./components/tareas-vista";
import { MisTareasVista } from "./components/mis-tareas-vista";
import { HistorialIngresos } from "./components/historial-ingresos";
import { TrabajadoresVista } from "./components/trabajadores-vista";
import { MaterialesVista } from "./components/materiales-vista";
import { BodegasVista } from "./components/bodegas-vista";
import { BodegaDetalle } from "./components/bodega-detalle";
import { ProveedoresVista } from "./components/proveedores-vista";
import { InventarioVista } from "./components/inventario-vista";
import { InventarioDetalle } from "./components/inventario-detalle";
import { EntregasVista } from "./components/entregas-vista";
import { EntregaDetalle } from "./components/entrega-detalle";
import { HistorialEntregasVista } from "./components/historial-entregas-vista";
import { RutaAdmin } from "./components/ruta-admin";
import {
  IngresoPage,
  ConveniosPage,
  LogsPage,
  ConfiguracionPage,
  ReportesPage,
  ServiciosExternosPage,
} from "./components/pages";

function Admin({ children }: { children: React.ReactNode }) {
  return <RutaAdmin>{children}</RutaAdmin>;
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
      { path: "configuracion", Component: ConfiguracionPage },
      { path: "servicios-externos", element: <Admin><ServiciosExternosPage /></Admin> },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
