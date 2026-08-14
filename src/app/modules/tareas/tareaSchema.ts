import { z } from "zod";
import { PRIORIDADES } from "@/app/modules/tareas/tareasApi";

/**
 * Replica CuerpoTarea (backend):
 *   titulo @NotBlank, descripcion (libre), asignadoId @NotNull, bodegaId (libre),
 *   prioridad @NotNull, fechaLimite (libre).
 *
 * "titulo" min 3 caracteres es regla solo-frontend, se conserva.
 */
export const tareaSchema = z.object({
  titulo: z.string().trim().min(3, "El título debe tener al menos 3 caracteres."),
  descripcion: z.string().trim(),
  asignadoId: z.string().min(1, "Selecciona el trabajador asignado."),
  bodegaId: z.string(),
  prioridad: z
    .string()
    .refine((v) => (PRIORIDADES as string[]).includes(v), "Selecciona la prioridad."),
  fechaLimite: z.string(),
});

export type TareaFormValues = z.infer<typeof tareaSchema>;

/**
 * Replica CuerpoAvance (backend):
 *   cantidad @Positive (opcional), descripcion @NotBlank @Size(max=300).
 *
 * "descripcion" min 3 caracteres es regla solo-frontend, se conserva.
 * Hallazgo extra: el backend limita descripcion a 300 caracteres — el frontend
 * anterior solo usaba maxLength HTML (evadible pegando texto), ahora se valida en zod.
 * cantidad es numérico OPCIONAL con default "": se valida sobre el string crudo
 * (refine), nunca con z.coerce.number(), para no convertir "" en 0.
 */
export const avanceSchema = z.object({
  cantidad: z
    .string()
    .refine(
      (v) => v === "" || (!Number.isNaN(parseFloat(v)) && parseFloat(v) > 0),
      "La cantidad debe ser un número mayor que 0, o déjala vacía.",
    ),
  descripcion: z
    .string()
    .trim()
    .min(3, "Describe qué hiciste (mínimo 3 caracteres).")
    .max(300, "La descripción no puede superar los 300 caracteres."),
});

export type AvanceFormValues = z.infer<typeof avanceSchema>;
