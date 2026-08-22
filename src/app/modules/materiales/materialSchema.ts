import { z } from "zod";

export const UNIDADES_MEDIDA = ["KILOGRAMO", "TONELADA", "UNIDAD"] as const;
export const UNIDADES_EMPAQUE = ["GRANEL", "PACA"] as const;

/**
 * Replica CuerpoMaterial (backend):
 *   nombre @NotBlank, categoriaCodigo @NotBlank, resinaCodigo/colorCodigo (libres),
 *   unidadMedida @NotNull, unidadEmpaque @NotNull, precioBase @NotNull @Positive,
 *   factorCalidad @NotNull @Positive, umbralMerma (libre).
 *
 * "nombre" min 3 caracteres y "umbralMerma entre 0 y 100" son reglas solo-frontend,
 * se conservan.
 *
 * Bug #4: precioBase debe ser @Positive estricto (backend rechaza 0), el frontend
 * anterior solo rechazaba < 0 y dejaba pasar 0.
 */
export const materialSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  categoriaCodigo: z.string().min(1, "Selecciona una categoría."),
  resinaCodigo: z.string(),
  colorCodigo: z.string(),
  unidadMedida: z
    .string()
    .refine((v) => (UNIDADES_MEDIDA as readonly string[]).includes(v), "Selecciona la unidad de medida."),
  unidadEmpaque: z
    .string()
    .refine((v) => (UNIDADES_EMPAQUE as readonly string[]).includes(v), "Selecciona la unidad de empaque."),
  precioBase: z.coerce
    .number({ error: "El precio base debe ser mayor que 0." })
    .positive("El precio base debe ser mayor que 0."),
  factorCalidad: z.coerce
    .number({ error: "El factor de calidad debe ser mayor que 0." })
    .positive("El factor de calidad debe ser mayor que 0."),
  umbralMerma: z
    .string()
    .refine((v) => {
      if (v === "") return true;
      const n = parseFloat(v);
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    }, "El umbral de merma debe estar entre 0 y 100."),
});

export type MaterialFormValues = z.infer<typeof materialSchema>;
export type MaterialFormInput = z.input<typeof materialSchema>;
export type MaterialFormOutput = z.output<typeof materialSchema>;
