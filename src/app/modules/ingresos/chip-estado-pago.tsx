import styles from "@/app/modules/ingresos/chip-estado-pago.module.css";
import type { EstadoPago, MetodoPago } from "@/app/modules/ingresos/ingresosApi";

const CLASE: Record<EstadoPago, string> = {
  POR_PAGAR: styles.porPagar,
  PAGADO: styles.pagado,
};

const ETIQUETA: Record<EstadoPago, string> = {
  POR_PAGAR: "Por pagar",
  PAGADO: "Pagado",
};

export const ETIQUETA_METODO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};

/** Chip del estado de pago; si ya se pagó, muestra también el método. */
export function ChipEstadoPago({
  estadoPago,
  metodoPago,
}: {
  estadoPago: EstadoPago;
  metodoPago: MetodoPago | null;
}) {
  const etiqueta =
    estadoPago === "PAGADO" && metodoPago
      ? `${ETIQUETA[estadoPago]} · ${ETIQUETA_METODO[metodoPago]}`
      : ETIQUETA[estadoPago];
  return <span className={`${styles.chip} ${CLASE[estadoPago]}`}>{etiqueta}</span>;
}
