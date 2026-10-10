import { z } from "zod";
import { CATEGORIA_PLASTICO, type Material } from "@/app/modules/materiales/materialesApi";

const lineaEntregaSchema = z.object({
  categoriaCodigo: z.string().min(1, "Selecciona una categoría."),
  resinaCodigo: z.string(),
  colorCodigo: z.string(),
  materialIdDirecto: z.string(),
  pesoKg: z.coerce
    .number({ error: "El peso debe ser mayor que 0." })
    .positive("El peso debe ser mayor que 0."),
});

type LineaEntregaInput = z.infer<typeof lineaEntregaSchema>;

/**
 * Resuelve una línea del formulario al `Material` real del catálogo: para
 * PLASTICO combina Resina+Color (campos independientes, igual que en el
 * prototipo); para el resto usa el material elegido directo. Devuelve
 * `undefined` si esa combinación todavía no está registrada en el catálogo.
 */
export function resolverMaterialLinea(materiales: Material[], linea: LineaEntregaInput): Material | undefined {
  if (!linea.categoriaCodigo) return undefined;
  if (linea.categoriaCodigo === CATEGORIA_PLASTICO) {
    if (!linea.resinaCodigo) return undefined;
    return materiales.find(
      (m) =>
        m.categoriaCodigo === linea.categoriaCodigo &&
        m.resinaCodigo === linea.resinaCodigo &&
        (m.colorCodigo ?? "") === linea.colorCodigo,
    );
  }
  return materiales.find((m) => m.id === linea.materialIdDirecto);
}

/**
 * Replica CuerpoEntrega (backend): convenioId/bodegaId/personaEntregaId
 * @NotNull, fechaRecepcion (libre, null -> hoy), lineas @NotEmpty (cada una
 * con tipoMaterialId @NotNull y pesoKg @NotNull @Positive).
 *
 * El material de cada línea no se elige directo: se resuelve en el momento
 * contra el catálogo ya cargado (`materiales`), así que el schema necesita
 * ese catálogo para poder validar que la combinación existe.
 */
export function crearEntregaSchema(materiales: Material[]) {
  return z
    .object({
      convenioId: z.string().min(1, "Selecciona un convenio."),
      bodegaId: z.string().min(1, "Selecciona una bodega."),
      personaEntregaId: z.string().min(1, "Selecciona quién entrega."),
      fechaRecepcion: z.string(),
      lineas: z.array(lineaEntregaSchema).min(1, "Agrega al menos una línea de material."),
    })
    .superRefine((data, ctx) => {
      data.lineas.forEach((linea, index) => {
        if (!resolverMaterialLinea(materiales, linea)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lineas", index],
            message: "Esta combinación no está registrada en el catálogo de materiales.",
          });
        }
      });
    });
}

// pesoKg usa z.coerce.number(): el valor "crudo" del input (antes del resolver)
// es string, distinto del valor ya coercido que recibe el onSubmit.
export type EntregaFormInput = z.input<ReturnType<typeof crearEntregaSchema>>;
export type EntregaFormOutput = z.output<ReturnType<typeof crearEntregaSchema>>;
