import styles from "./indicador-stock.module.css";
import type { LineaInventario } from "../servicios/inventarioApi";

type Estado = "BAJO" | "ALTO" | "OK";

function calcularEstado(linea: LineaInventario): Estado {
  if (linea.bajoMinimo || linea.stockActual < linea.stockMinimo) return "BAJO";
  if (linea.stockMaximo > 0 && linea.stockActual > linea.stockMaximo) return "ALTO";
  return "OK";
}

const COLOR: Record<Estado, string> = {
  BAJO: "#d4183d",
  ALTO: "#e0a106",
  OK: "#16a34a",
};

export function ChipStock({ linea }: { linea: LineaInventario }) {
  const estado = calcularEstado(linea);
  const clase = estado === "BAJO" ? styles.chipBajo : estado === "ALTO" ? styles.chipAlto : styles.chipOk;
  const texto = estado === "BAJO" ? "Bajo mínimo" : estado === "ALTO" ? "Sobre máximo" : "Normal";
  return <span className={`${styles.chip} ${clase}`}>{texto}</span>;
}

export function IndicadorStock({ linea }: { linea: LineaInventario }) {
  const estado = calcularEstado(linea);
  const porcentaje =
    linea.stockMaximo > 0 ? Math.max(0, Math.min(100, (linea.stockActual / linea.stockMaximo) * 100)) : 0;

  return (
    <div className={styles.contenedor}>
      <div className={styles.barra}>
        <div
          className={styles.barraRelleno}
          style={{ width: `${porcentaje}%`, backgroundColor: COLOR[estado] }}
        />
      </div>
      <div className={styles.texto}>
        {linea.stockActual.toLocaleString("es-CO")} / {linea.stockMaximo.toLocaleString("es-CO")}{" "}
        {linea.unidadMedida === "KILOGRAMO" ? "kg" : ""}
      </div>
    </div>
  );
}

export { calcularEstado };
