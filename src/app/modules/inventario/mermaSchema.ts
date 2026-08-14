import { z } from "zod";

/**
 * Replica CuerpoMerma (backend): cantidad @NotNull @Positive, motivo @NotBlank.
 * "motivo" minimo 5 caracteres es una regla solo-frontend (mas estricta que @NotBlank),
 * se conserva.
 */
export const mermaSchema = z.object({
  cantidad: z.coerce
    .number({ error: "La cantidad debe ser mayor que 0." })
    .positive("La cantidad debe ser mayor que 0."),
  motivo: z.string().trim().min(5, "El motivo debe tener al menos 5 caracteres."),
});

export type MermaFormValues = z.infer<typeof mermaSchema>;
export type MermaFormInput = z.input<typeof mermaSchema>;
export type MermaFormOutput = z.output<typeof mermaSchema>;
