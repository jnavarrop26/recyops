import { z } from "zod";
import { TIPOS_CONVENIO } from "@/app/modules/convenios/conveniosApi";

/**
 * Replica CuerpoConvenio (backend):
 *   nombre @NotBlank, tipo @NotNull, proveedorId/bodegaId (libres, UUID o null),
 *   fechaInicio @NotNull, fechaFin (libre), valorTotal (libre), responsable (libre),
 *   descripcion (libre).
 *
 * "nombre" min 3 caracteres es regla solo-frontend, se conserva.
 * "fechaFin >= fechaInicio" NO existe en el backend — es puramente frontend, se
 * conserva vía superRefine y se documenta como tal.
 *
 * valorTotal es numérico OPCIONAL con default "": se valida sobre el string crudo
 * (refine), nunca con z.coerce.number(), porque coerce convertiría "" en 0 y rompería
 * la semántica de "vacío = no se envía valorTotal".
 */
export const convenioSchema = z
  .object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
    tipo: z
      .string()
      .refine((v) => (TIPOS_CONVENIO as string[]).includes(v), "Selecciona el tipo de convenio."),
    proveedorId: z.string(),
    bodegaId: z.string(),
    fechaInicio: z.string().min(1, "La fecha de inicio es obligatoria."),
    fechaFin: z.string(),
    valorTotal: z
      .string()
      .refine(
        (v) => v === "" || (!Number.isNaN(parseFloat(v)) && parseFloat(v) >= 0),
        "El valor debe ser un número positivo.",
      ),
    responsable: z.string().trim(),
    descripcion: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    // Regla solo-frontend: no existe en CuerpoConvenio, el backend no la valida.
    if (data.fechaFin && data.fechaInicio && data.fechaFin < data.fechaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fechaFin"],
        message: "La fecha de fin no puede ser anterior a la de inicio.",
      });
    }
  });

export type ConvenioFormValues = z.infer<typeof convenioSchema>;
