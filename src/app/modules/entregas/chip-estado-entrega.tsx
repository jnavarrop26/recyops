import styles from "@/app/modules/entregas/chip-estado-entrega.module.css";
import type { EstadoEntrega } from "@/app/modules/entregas/entregasApi";

const CLASE: Record<EstadoEntrega, string> = {
  RECIBIDA: styles.recibida,
  EN_PROCESO: styles.enProceso,
  PROCESADA: styles.procesada,
  DESPACHADA: styles.despachada,
};

const ETIQUETA: Record<EstadoEntrega, string> = {
  RECIBIDA: "Recibida",
  EN_PROCESO: "En proceso",
  PROCESADA: "Procesada",
  DESPACHADA: "Despachada",
};

export function ChipEstadoEntrega({ estado }: { estado: EstadoEntrega }) {
  return <span className={`${styles.chip} ${CLASE[estado]}`}>{ETIQUETA[estado]}</span>;
}
