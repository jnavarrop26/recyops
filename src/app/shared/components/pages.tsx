import { Page } from "@/app/shared/components/page";
import { IngresoForm } from "@/app/modules/ingresos/ingreso-form";
import { ConveniosVista } from "@/app/modules/convenios/convenios-vista";
import { ConfiguracionVista } from "@/app/modules/configuracion/configuracion-vista";
import { ReportesVista } from "@/app/modules/reportes/reportes-vista";
import { LogsVista } from "@/app/modules/logs/logs-vista";
import pageStyles from "@/app/shared/components/page.module.css";

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
