import { z } from "zod";

/**
 * Replica CuerpoCrearLinea (bodegaId/tipoMaterialId @NotNull, stockMinimo/stockMaximo
 * @NotNull @PositiveOrZero) y CuerpoTopes (stockMinimo/stockMaximo @NotNull @PositiveOrZero).
 *
 * bodegaId/tipoMaterialId solo son obligatorios al crear (no se editan en el PUT de topes).
 * "stockMaximo >= stockMinimo" es una regla solo-frontend, no existe en el backend — se
 * conserva vía superRefine.
 */
const baseLineaSchema = z.object({
  bodegaId: z.string(),
  tipoMaterialId: z.string(),
  stockMinimo: z.coerce
    .number({ error: "El stock mínimo debe ser ≥ 0." })
    .min(0, "El stock mínimo debe ser ≥ 0."),
  stockMaximo: z.coerce
    .number({ error: "El stock máximo debe ser ≥ 0." })
    .min(0, "El stock máximo debe ser ≥ 0."),
});

export function crearLineaConfigurarSchema(esEdicion: boolean) {
  return baseLineaSchema.superRefine((data, ctx) => {
    if (!esEdicion && !data.bodegaId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["bodegaId"], message: "Selecciona una bodega." });
    }
    if (!esEdicion && !data.tipoMaterialId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipoMaterialId"], message: "Selecciona un material." });
    }
    if (data.stockMaximo < data.stockMinimo) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stockMaximo"], message: "El stock máximo debe ser ≥ al mínimo." });
    }
  });
}

export type LineaConfigurarFormValues = z.infer<typeof baseLineaSchema>;
export type LineaConfigurarFormInput = z.input<typeof baseLineaSchema>;
export type LineaConfigurarFormOutput = z.output<typeof baseLineaSchema>;
