import { z } from "zod";

/**
 * Replica CuerpoEntrega (backend):
 *   proveedorId @NotNull, bodegaId @NotNull, tipoMaterialId @NotNull,
 *   pesoKg @NotNull @Positive, personaEntrega (libre), fechaRecepcion (libre, null -> hoy).
 */
export const entregaSchema = z.object({
  proveedorId: z.string().min(1, "Selecciona un proveedor."),
  bodegaId: z.string().min(1, "Selecciona una bodega."),
  tipoMaterialId: z.string().min(1, "Selecciona un material."),
  pesoKg: z.coerce
    .number({ error: "El peso debe ser mayor que 0." })
    .positive("El peso debe ser mayor que 0."),
  personaEntrega: z.string().trim(),
  fechaRecepcion: z.string(),
});

export type EntregaFormValues = z.infer<typeof entregaSchema>;
// pesoKg usa z.coerce.number(): el valor "crudo" del input (antes del resolver) es
// `unknown`/string, distinto del valor ya coercido que recibe el onSubmit.
export type EntregaFormInput = z.input<typeof entregaSchema>;
export type EntregaFormOutput = z.output<typeof entregaSchema>;
