import { z } from "zod";

/**
 * Replica CuerpoAjuste (backend): cantidadNueva @NotNull @PositiveOrZero, motivo @NotBlank.
 * "motivo" minimo 5 caracteres es una regla solo-frontend (mas estricta que @NotBlank),
 * se conserva.
 */
export const ajusteSchema = z.object({
  cantidadNueva: z.coerce
    .number({ error: "La cantidad nueva debe ser mayor o igual a 0." })
    .min(0, "La cantidad nueva debe ser mayor o igual a 0."),
  motivo: z.string().trim().min(5, "El motivo debe tener al menos 5 caracteres."),
});

export type AjusteFormValues = z.infer<typeof ajusteSchema>;
export type AjusteFormInput = z.input<typeof ajusteSchema>;
export type AjusteFormOutput = z.output<typeof ajusteSchema>;
