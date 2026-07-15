import { useState } from "react";
import styles from "@/app/shared/components/estrellas-calificacion.module.css";

const RUTA_ESTRELLA =
  "M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88-5-4.87 7.1-1.01L12 2z";

function IconoEstrella() {
  return (
    <svg className={styles.svg} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={RUTA_ESTRELLA} />
    </svg>
  );
}

export function EstrellasCalificacion({
  valor,
  interactivo = false,
  grande = false,
  alCambiar,
}: {
  valor: number;
  interactivo?: boolean;
  grande?: boolean;
  alCambiar?: (nuevoValor: number) => void;
}) {
  const [previsualizacion, setPrevisualizacion] = useState<number | null>(null);
  const mostrado = previsualizacion ?? valor;

  const claseEstrella = `${styles.estrella} ${grande ? styles.estrellaGrande : ""}`;

  return (
    <div className={styles.contenedor}>
      {[0, 1, 2, 3, 4].map((indice) => {
        const base = indice + 1;
        const porcentaje = Math.max(0, Math.min(1, mostrado - indice)) * 100;
        return (
          <span key={indice} className={claseEstrella}>
            <IconoEstrella />
            <span className={styles.relleno} style={{ width: `${porcentaje}%` }}>
              <IconoEstrella />
            </span>
            {interactivo && (
              <>
                <button
                  type="button"
                  className={`${styles.botonMitad} ${styles.mitadIzq}`}
                  aria-label={`Calificar ${base - 0.5} estrellas`}
                  onMouseEnter={() => setPrevisualizacion(base - 0.5)}
                  onMouseLeave={() => setPrevisualizacion(null)}
                  onClick={() => alCambiar?.(base - 0.5)}
                />
                <button
                  type="button"
                  className={`${styles.botonMitad} ${styles.mitadDer}`}
                  aria-label={`Calificar ${base} estrellas`}
                  onMouseEnter={() => setPrevisualizacion(base)}
                  onMouseLeave={() => setPrevisualizacion(null)}
                  onClick={() => alCambiar?.(base)}
                />
              </>
            )}
          </span>
        );
      })}
      <span className={styles.valor}>{mostrado.toFixed(1)}</span>
    </div>
  );
}
