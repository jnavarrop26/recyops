import styles from "./bodegas-vista.module.css";
import type { EstadoBodega } from "../servicios/bodegasApi";

const ETIQUETA_ESTADO: Record<EstadoBodega, string> = {
  ACTIVA: "Activa",
  INACTIVA: "Inactiva",
  MANTENIMIENTO: "Mantenimiento",
};

export function ChipEstado({ estado }: { estado: EstadoBodega }) {
  const clase =
    estado === "ACTIVA"
      ? styles.chipActiva
      : estado === "MANTENIMIENTO"
        ? styles.chipMantenimiento
        : styles.chipInactiva;
  return <span className={`${styles.chip} ${clase}`}>{ETIQUETA_ESTADO[estado]}</span>;
}
