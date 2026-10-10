import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "motion/react";
import { Handshake, Package, Scale, Warehouse } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { Entrega } from "@/app/modules/entregas/entregasApi";
import styles from "@/app/modules/entregas/exito-entrega.module.css";

// Línea de tiempo (segundos). Base elegante (easing suave, sin rebote) con
// acentos playful (spring con overshoot) solo en los momentos de llegada.
const T = {
  nodos: 0.25,
  salida: 0.65, // el material sale de bodega
  tramo: 0.7, // duración de cada salto entre nodos
  pausaBascula: 0.5, // se queda en la báscula mientras cuenta los kg
  check: 2.65,
  resumen: 2.95,
  fin: 4.8, // cierre automático
} as const;

const LLEGADA_BASCULA = T.salida + T.tramo;
const SALIDA_BASCULA = LLEGADA_BASCULA + T.pausaBascula;
const LLEGADA_CONVENIO = SALIDA_BASCULA + T.tramo;
const RECORRIDO = LLEGADA_CONVENIO - T.salida;

const PISTA = 260; // px entre el primer y el último nodo
const ALTURA_SALTO = -22;

const EASE_ELEGANTE = [0.4, 0, 0.2, 1] as const;
// Motion no interpola var(--x); se usan los valores de theme.css.
const COLOR = {
  reposo: "#F3F5F4", // --surface
  tintaReposo: "#5A6B62", // --ink-muted
  marca: "#0F5132", // --brand
  tintaActiva: "#FFFFFF",
} as const;

const POP: Transition = { type: "spring", stiffness: 420, damping: 14 };

const fraccion = (t: number) => (t - T.salida) / RECORRIDO;

export function ExitoEntrega({
  entrega,
  alTerminar,
}: {
  entrega: Entrega;
  alTerminar: () => void;
}) {
  const reducido = useReducedMotion();
  const terminado = useRef(false);

  const kg = useMotionValue(0);
  const kgTexto = useTransform(kg, (v) => `${v.toFixed(1)} kg`);

  function terminar() {
    if (terminado.current) return;
    terminado.current = true;
    alTerminar();
  }

  useEffect(() => {
    if (reducido) {
      kg.set(entrega.totalKg);
      return;
    }
    const conteo = animate(kg, entrega.totalKg, {
      delay: LLEGADA_BASCULA,
      duration: T.pausaBascula + 0.2,
      ease: EASE_ELEGANTE,
    });
    return () => conteo.stop();
  }, [entrega.totalKg, kg, reducido]);

  useEffect(() => {
    const id = window.setTimeout(terminar, T.fin * 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Con movimiento reducido, todo aparece en su estado final sin desplazamientos.
  const t = (transition: Transition): Transition => (reducido ? { duration: 0 } : transition);

  const nodos = [
    { icono: Warehouse, titulo: "Bodega", detalle: entrega.bodegaNombre, llegada: T.salida },
    { icono: Scale, titulo: "Báscula", detalle: null, llegada: LLEGADA_BASCULA },
    {
      icono: Handshake,
      titulo: "Convenio",
      detalle: entrega.convenioNombre ?? "—",
      llegada: LLEGADA_CONVENIO,
    },
  ];

  const p1 = fraccion(LLEGADA_BASCULA);
  const p2 = fraccion(SALIDA_BASCULA);

  return (
    <div
      className={styles.escena}
      onClick={terminar}
      role="status"
      aria-live="polite"
      aria-label={`Entrega ${entrega.codigo} registrada`}
    >
      <motion.div
        className={styles.ambiente}
        aria-hidden
        initial={{ opacity: 0 }}
        animate={reducido ? { opacity: 0.6 } : { opacity: [0, 0.75, 0.5, 0.75] }}
        transition={t({ duration: 4, ease: "easeInOut", times: [0, 0.2, 0.6, 1] })}
      />

      {/* Flujo del material: bodega → báscula → convenio */}
      <div className={styles.flujo} aria-hidden>
        <div className={styles.pista}>
          <div className={styles.riel} />
          <motion.div
            className={styles.rielActivo}
            style={{ width: PISTA / 2, left: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={t({ delay: T.salida, duration: T.tramo, ease: EASE_ELEGANTE })}
          />
          <motion.div
            className={styles.rielActivo}
            style={{ width: PISTA / 2, left: PISTA / 2 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={t({ delay: SALIDA_BASCULA, duration: T.tramo, ease: EASE_ELEGANTE })}
          />

          {nodos.map(({ icono: Icono, titulo, detalle, llegada }, i) => (
            <motion.div
              key={titulo}
              className={styles.nodo}
              style={{ left: (PISTA / 2) * i }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={t({ delay: T.nodos + i * 0.08, duration: 0.4, ease: EASE_ELEGANTE })}
            >
              <motion.div
                className={styles.circulo}
                initial={{ scale: 1, backgroundColor: COLOR.reposo, color: COLOR.tintaReposo }}
                animate={{
                  scale: reducido ? 1 : [1, 1.14, 1],
                  backgroundColor: COLOR.marca,
                  color: COLOR.tintaActiva,
                }}
                transition={t({
                  delay: llegada,
                  scale: { delay: llegada, duration: 0.45, ease: [0.175, 0.885, 0.32, 1.275] },
                  duration: 0.3,
                })}
              >
                <Icono size={22} strokeWidth={1.75} />
              </motion.div>
              <span className={styles.nodoTitulo}>{titulo}</span>
              {detalle !== null ? (
                <span className={styles.nodoDetalle} title={detalle}>
                  {detalle}
                </span>
              ) : (
                <motion.span className={`${styles.nodoDetalle} ${styles.kg}`}>{kgTexto}</motion.span>
              )}
            </motion.div>
          ))}

          {!reducido && (
            <motion.div
              className={styles.material}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: [0, PISTA / 4, PISTA / 2, PISTA / 2, (PISTA * 3) / 4, PISTA],
                y: [0, ALTURA_SALTO, 0, 0, ALTURA_SALTO, 0],
                scale: [1, 1, 0.82, 1, 1, 0.3],
                opacity: [1, 1, 1, 1, 1, 0],
              }}
              transition={{
                delay: T.salida,
                duration: RECORRIDO,
                times: [0, p1 / 2, p1, p2, p2 + (1 - p2) / 2, 1],
                ease: ["easeOut", "easeIn", "easeInOut", "easeOut", "easeIn"],
              }}
            >
              <Package size={14} strokeWidth={2} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Confirmación */}
      <div className={styles.confirmacion}>
        <div className={styles.check}>
          <motion.span
            className={styles.onda}
            aria-hidden
            initial={{ scale: 1, opacity: 0 }}
            animate={reducido ? { opacity: 0 } : { scale: [1, 1.9], opacity: [0.45, 0] }}
            transition={t({ delay: T.check + 0.1, duration: 0.8, ease: "easeOut" })}
          />
          <motion.svg
            viewBox="0 0 48 48"
            width={48}
            height={48}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={t({ ...POP, delay: T.check })}
          >
            <circle cx="24" cy="24" r="24" fill="var(--brand)" />
            <motion.path
              d="M14 24.5 L21 31.5 L34 17.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={t({ delay: T.check + 0.15, duration: 0.35, ease: EASE_ELEGANTE })}
            />
          </motion.svg>
        </div>

        <motion.div
          className={styles.textos}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t({ delay: T.check + 0.15, duration: 0.4, ease: EASE_ELEGANTE })}
        >
          <h3 className={styles.titulo}>Entrega registrada</h3>
          <p className={styles.subtitulo}>
            <span className={styles.codigo}>{entrega.codigo}</span>
            {entrega.personaEntregaNombre && <> · {entrega.personaEntregaNombre}</>}
          </p>
        </motion.div>

        <ul className={styles.lineas}>
          {entrega.lineas.map((linea, i) => (
            <motion.li
              key={`${linea.tipoMaterialId}-${i}`}
              className={styles.chip}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={t({ delay: T.resumen + Math.min(i * 0.05, 0.3), duration: 0.35, ease: EASE_ELEGANTE })}
            >
              {linea.tipoMaterialNombre} · <strong>{linea.pesoKg.toFixed(2)} kg</strong>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className={styles.pie}>
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            terminar();
          }}
        >
          Continuar
        </Button>
        <motion.div
          className={styles.progreso}
          aria-hidden
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: T.fin, ease: "linear" }}
        />
      </div>
    </div>
  );
}
