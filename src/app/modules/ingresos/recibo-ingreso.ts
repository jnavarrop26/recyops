import logoMarcaAgua from "@/app/public/icons/logo-1-recyops.svg?raw";
import faviconRecyops from "@/app/public/icons/favicon-recyops.svg?raw";
import { obtenerIngresoPorUuid, type Ingreso } from "@/app/modules/ingresos/ingresosApi";

/**
 * Plantilla HTML imprimible del recibo de ingreso de material.
 * Se abre en una ventana nueva lista para imprimir o guardar como PDF.
 * Usa el logo 1 de RecyOps como marca de agua y el isotipo en la cabecera.
 */

const ETIQUETAS_ESTADO: Record<string, string> = {
  POR_CLASIFICAR: "Por clasificar",
  EN_BODEGA: "En bodega",
  DESPACHADO: "Despachado",
  RECHAZADO: "Rechazado",
};

const TINTAS_ESTADO: Record<string, string> = {
  POR_CLASIFICAR: "#B97A12",
  EN_BODEGA: "#178E3B",
  DESPACHADO: "#178E3B",
  RECHAZADO: "#C0392B",
};

const ETIQUETAS_PAGO: Record<string, string> = {
  POR_PAGAR: "Por pagar",
  PAGADO: "Pagado",
};

const ETIQUETAS_METODO: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
};

const escapar = (valor: string | null | undefined) =>
  (valor ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const moneda = (v: number) =>
  "$ " + v.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const kilos = (v: number) =>
  v.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const folio = (id: number) => "REC-" + String(id).padStart(6, "0");

function fechaLarga(iso: string) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleString("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tablaMateriales(ingreso: Ingreso): string {
  if (!ingreso.detalles || ingreso.detalles.length === 0) return "";
  const filas = ingreso.detalles
    .map(
      (d) => `<tr>
        <td>${escapar(d.categoria)}${d.observaciones ? `<div class="obs">${escapar(d.observaciones)}</div>` : ""}</td>
        <td class="num mono">${kilos(d.pesoBruto)}</td>
        <td class="num mono">${kilos(d.tara)}</td>
        <td class="num mono">${kilos(d.pesoNeto)}</td>
        <td class="num mono">${moneda(d.precioKilo)}</td>
        <td class="num mono">${moneda(d.subtotal)}</td>
      </tr>`,
    )
    .join("");
  return `
      <table class="materiales">
        <thead>
          <tr>
            <th>Material</th>
            <th class="num">Bruto (kg)</th>
            <th class="num">Tara (kg)</th>
            <th class="num">Neto (kg)</th>
            <th class="num">Precio / kg</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>`;
}

export function plantillaReciboIngreso(ingreso: Ingreso): string {
  const estado = ETIQUETAS_ESTADO[ingreso.estado] ?? ingreso.estado;
  const tintaEstado = TINTAS_ESTADO[ingreso.estado] ?? "#203529";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${folio(ingreso.id)} · Recibo de ingreso · RecyOPS</title>
<style>
  :root {
    --tinta: #203529;
    --verde: #178E3B;
    --verde-claro: #2FA65B;
    --linea: #D9E2DC;
    --tenue: #6B7C72;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #EDF1EE;
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--tinta);
    padding: 32px 16px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .mono { font-family: ui-monospace, "Cascadia Mono", Consolas, "Courier New", monospace; }

  .recibo {
    position: relative;
    width: 640px;
    max-width: 100%;
    margin: 0 auto;
    background: #fff;
    border-left: 1px solid var(--linea);
    border-right: 1px solid var(--linea);
    overflow: hidden;
  }
  /* Perforado de tiquete arriba y abajo */
  .perforado {
    height: 12px;
    background:
      radial-gradient(circle at 8px 0, #EDF1EE 5px, transparent 5.5px) repeat-x,
      #fff;
    background-size: 16px 12px;
  }
  .perforado.abajo { transform: rotate(180deg); }

  .marca-agua {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }
  .marca-agua svg { width: 68%; height: auto; }

  .contenido { position: relative; z-index: 1; padding: 24px 36px 28px; }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 3px solid var(--verde);
    padding-bottom: 16px;
  }
  .identidad { display: flex; align-items: center; gap: 12px; }
  .identidad svg { width: 46px; height: 46px; }
  .nombre { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
  .nombre span { color: var(--verde); }
  .lema { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tenue); margin-top: 2px; }
  .folio { text-align: right; }
  .folio-etiqueta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tenue); }
  .folio-numero { font-size: 19px; font-weight: 700; }
  .folio-fecha { font-size: 11px; color: var(--tenue); margin-top: 3px; }
  .folio-uuid { font-size: 9px; color: var(--tenue); margin-top: 4px; letter-spacing: 0.02em; }

  .materiales { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 12.5px; }
  .materiales th {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--tenue);
    text-align: left;
    padding: 7px 8px;
    border-bottom: 1.5px solid var(--tinta);
  }
  .materiales td { padding: 7px 8px; border-bottom: 1px dashed var(--linea); vertical-align: top; }
  .materiales .num { text-align: right; white-space: nowrap; }
  .materiales .obs { font-size: 10px; color: var(--tenue); margin-top: 2px; }

  .titulo-doc {
    margin: 18px 0 14px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--tinta);
  }

  .sello {
    position: absolute;
    top: 132px;
    right: 34px;
    transform: rotate(-8deg);
    border: 2.5px solid ${tintaEstado};
    border-radius: 6px;
    box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 3.5px ${tintaEstado};
    color: ${tintaEstado};
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    padding: 7px 14px;
    opacity: 0.85;
    z-index: 2;
  }

  .datos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 32px;
    border-top: 1px dashed var(--linea);
  }
  .grupo { padding: 12px 0; }
  .grupo + .grupo { border-top: 1px dashed var(--linea); }
  .datos .grupo:nth-child(2) { border-top: none; }
  .etiqueta {
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--tenue);
    margin-bottom: 4px;
  }
  .valor { font-size: 14px; }

  .cifras {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1.5px solid var(--tinta);
    margin-top: 16px;
  }
  .cifra { padding: 14px 18px 16px; }
  .cifra + .cifra { border-left: 1.5px solid var(--tinta); }
  .cifra-valor { font-size: 25px; font-weight: 700; line-height: 1.1; white-space: nowrap; }
  .cifra-unidad { font-size: 13px; font-weight: 400; color: var(--tenue); }

  .firmas {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    margin-top: 44px;
  }
  .firma { border-top: 1px solid var(--tinta); padding-top: 6px; }
  .firma .etiqueta { margin-bottom: 2px; }
  .firma .valor { font-size: 12px; color: var(--tenue); }

  footer {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px dashed var(--linea);
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: var(--tenue);
    letter-spacing: 0.04em;
  }

  .acciones { text-align: center; margin: 22px auto 0; }
  .acciones button {
    font: inherit;
    font-weight: 600;
    color: #fff;
    background: var(--verde);
    border: none;
    border-radius: 8px;
    padding: 10px 26px;
    cursor: pointer;
  }
  .acciones button:hover { background: var(--verde-claro); }

  @media print {
    body { background: #fff; padding: 0; }
    .recibo { width: 100%; border: none; }
    .perforado { display: none; }
    .acciones { display: none; }
  }
  @page { size: letter portrait; margin: 18mm 16mm; }
</style>
</head>
<body>
  <div class="recibo">
    <div class="perforado"></div>
    <div class="marca-agua">${logoMarcaAgua}</div>

    <div class="sello">${escapar(estado)}</div>

    <div class="contenido">
      <header>
        <div class="identidad">
          ${faviconRecyops}
          <div>
            <div class="nombre">Recy<span>OPS</span></div>
            <div class="lema">Sistema de bodegas de reciclaje</div>
          </div>
        </div>
        <div class="folio">
          <div class="folio-etiqueta">Recibo N.º</div>
          <div class="folio-numero mono">${folio(ingreso.id)}</div>
          <div class="folio-fecha">${escapar(fechaLarga(ingreso.fecha))}</div>
          <div class="folio-uuid mono">Verificación: ${escapar(ingreso.uuid)}</div>
        </div>
      </header>

      <div class="titulo-doc">Recibo de ingreso de material</div>

      <div class="datos">
        <div class="grupo">
          <div class="etiqueta">Cliente</div>
          <div class="valor">${escapar(ingreso.cliente)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Cédula / NIT</div>
          <div class="valor mono">${escapar(ingreso.cedula)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Bodega destino</div>
          <div class="valor">${escapar(ingreso.bodegaDestino)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Encargado de recepción</div>
          <div class="valor">${escapar(ingreso.encargado)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Placa del vehículo</div>
          <div class="valor mono">${escapar(ingreso.placaVehiculo)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Fecha y hora de ingreso</div>
          <div class="valor">${escapar(fechaLarga(ingreso.fecha))}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Estado de pago</div>
          <div class="valor">${escapar(ETIQUETAS_PAGO[ingreso.estadoPago] ?? ingreso.estadoPago)}</div>
        </div>
        <div class="grupo">
          <div class="etiqueta">Método de pago</div>
          <div class="valor">${escapar(ingreso.metodoPago ? (ETIQUETAS_METODO[ingreso.metodoPago] ?? ingreso.metodoPago) : null)}</div>
        </div>
      </div>

      ${tablaMateriales(ingreso)}

      <div class="cifras">
        <div class="cifra">
          <div class="etiqueta">Peso neto total</div>
          <div class="cifra-valor mono">${kilos(ingreso.pesoNetoTotal)} <span class="cifra-unidad">kg</span></div>
        </div>
        <div class="cifra">
          <div class="etiqueta">Total a pagar</div>
          <div class="cifra-valor mono">${moneda(ingreso.total)}</div>
        </div>
      </div>

      <div class="firmas">
        <div class="firma">
          <div class="etiqueta">Entrega</div>
          <div class="valor">${escapar(ingreso.cliente)} · CC ${escapar(ingreso.cedula)}</div>
        </div>
        <div class="firma">
          <div class="etiqueta">Recibe</div>
          <div class="valor">${escapar(ingreso.encargado)} · ${escapar(ingreso.bodegaDestino)}</div>
        </div>
      </div>

      <footer>
        <span>RecyOPS · Trazabilidad de material reciclable</span>
        <span class="mono">${folio(ingreso.id)} · ${escapar(ingreso.uuid)}</span>
      </footer>
    </div>
    <div class="perforado abajo"></div>
  </div>

  <div class="acciones">
    <button onclick="window.print()">Imprimir recibo</button>
  </div>
</body>
</html>`;
}

/** Abre el recibo en una pestaña nueva listo para imprimir o guardar en PDF. */
export function abrirReciboIngreso(ingreso: Ingreso) {
  const ventana = window.open("", "_blank");
  if (!ventana) return;
  ventana.document.write(plantillaReciboIngreso(ingreso));
  ventana.document.close();
}

/**
 * Trae el ingreso completo (con su detalle de materiales) y abre el recibo.
 * Se consulta por UUID (identificador público no enumerable, como Supabase).
 * La ventana se abre primero para no chocar con el bloqueador de emergentes.
 */
export async function abrirReciboIngresoPorUuid(uuid: string) {
  const ventana = window.open("", "_blank");
  if (!ventana) return;
  ventana.document.write(
    '<p style="font-family:sans-serif;padding:24px;color:#203529">Generando recibo…</p>',
  );
  try {
    const ingreso = await obtenerIngresoPorUuid(uuid);
    ventana.document.open();
    ventana.document.write(plantillaReciboIngreso(ingreso));
    ventana.document.close();
  } catch {
    ventana.document.open();
    ventana.document.write(
      '<p style="font-family:sans-serif;padding:24px;color:#c0392b">No se pudo generar el recibo. Revisa la conexión con el servidor.</p>',
    );
    ventana.document.close();
  }
}
