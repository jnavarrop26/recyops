import { z } from "zod";

/**
 * Replica CuerpoTrabajador (backend):
 *   nombreCompleto @NotBlank, username @NotBlank, email @NotBlank @Email,
 *   telefono (libre), bodegaId @NotNull, rolId @NotNull,
 *   password (opcional, @Size(min=8) si se envía).
 *
 * "nombreCompleto" min 3 caracteres y "username sin espacios" son reglas
 * solo-frontend, se conservan. `generarAutomatico` no viaja al backend, solo
 * decide si `password` se envía; el min 8 solo aplica cuando el admin decide
 * fijar la contraseña manualmente y escribe algo — se valida con superRefine.
 */
export const trabajadorSchema = z
  .object({
    nombreCompleto: z.string().trim().min(3, "El nombre completo debe tener al menos 3 caracteres."),
    username: z
      .string()
      .trim()
      .min(1, "El username es obligatorio.")
      .refine((v) => !/\s/.test(v), "El username no puede contener espacios."),
    email: z
      .string()
      .trim()
      .min(1, "El correo es obligatorio.")
      .refine((v) => z.string().email().safeParse(v).success, "Ingresa un correo con formato válido."),
    cedula: z.string().trim().min(1, "La cédula es obligatoria."),
    telefono: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d+$/.test(v), "El teléfono solo puede contener números."),
    bodegaId: z.string().min(1, "Selecciona una bodega."),
    rolId: z.string().min(1, "Selecciona un rol."),
    password: z.string(),
    generarAutomatico: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.generarAutomatico && data.password && data.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }
  });

export type TrabajadorFormValues = z.infer<typeof trabajadorSchema>;

/**
 * Replica CuerpoEditarTrabajador (backend):
 *   nombreCompleto @NotBlank, telefono (libre), bodegaId @NotNull, rolId @NotNull.
 * email/username son identidad y no se editan (no forman parte de este schema).
 */
export const editarTrabajadorSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "El nombre completo debe tener al menos 3 caracteres."),
  cedula: z.string().trim().min(1, "La cédula es obligatoria."),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "El teléfono solo puede contener números."),
  bodegaId: z.string().min(1, "Selecciona una bodega."),
  rolId: z.string().min(1, "Selecciona un rol."),
});

export type EditarTrabajadorFormValues = z.infer<typeof editarTrabajadorSchema>;
