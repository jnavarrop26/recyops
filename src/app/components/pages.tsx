import { Page } from "./page";
import { IngresoForm } from "./ingreso-form";
import { ConveniosVista } from "./convenios-vista";
import { ConfiguracionVista } from "./configuracion-vista";
import { ReportesVista } from "./reportes-vista";
import { LogsVista } from "./logs-vista";
import pageStyles from "./page.module.css";

export function IngresoPage() {
  return (
    <div className={pageStyles.page}>
      <h1 className={pageStyles.title}>Ingreso</h1>
      <p className={pageStyles.subtitle} style={{ marginBottom: 28 }}>
        Registro de material reciclable que ingresa a la bodega.
      </p>
      <IngresoForm />
    </div>
  );
}

export function TrabajadoresPage() {
  return <Page title="Trabajadores" subtitle="Gestión del personal de la bodega." />;
}

export function ConveniosPage() {
  return <ConveniosVista />;
}

export function LogsPage() {
  return <LogsVista />;
}

export function BodegasPage() {
  return <Page title="Bodegas" subtitle="Administración de bodegas y ubicaciones." />;
}

export function ConfiguracionPage() {
  return <ConfiguracionVista />;
}

export function ReportesPage() {
  return <ReportesVista />;
}

export function ServiciosExternosPage() {
  return <Page title="Servicios externos" subtitle="Integraciones con servicios de terceros." />;
}
