import { z } from "zod";

const SCHEMA_RE = /^[a-z][a-z0-9_]{1,62}$/;

/**
 * Replica CuerpoNuevaEmpresa (backend):
 *   nombre @NotBlank @Size(max=200), nit @NotBlank @Size(max=30),
 *   schemaNombre @NotBlank @Pattern(^[a-z][a-z0-9_]{1,62}$),
 *   adminEmail @NotBlank @Email, adminNombreCompleto @NotBlank @Size(max=200),
 *   adminUsername @NotBlank @Size(max=100), adminPassword (libre).
 *
 * "nombre" min 3 / "adminNombreCompleto" min 3 son reglas solo-frontend, se conservan.
 *
 * Bug #5: el frontend anterior no tenía tope de longitud en nombre/nit/
 * adminNombreCompleto/adminUsername pese a los @Size(max=...) del backend — se
 * agregan aquí para que el 400 nunca llegue a producirse por longitud excesiva.
 */
export const plataformaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(200, "El nombre no puede superar los 200 caracteres."),
    nit: z
      .string()
      .trim()
      .min(1, "El NIT es obligatorio.")
      .max(30, "El NIT no puede superar los 30 caracteres."),
    schemaNombre: z
      .string()
      .trim()
      .refine(
        (v) => SCHEMA_RE.test(v),
        "Solo minúsculas, números y guion bajo. Debe iniciar con letra (ej: empresa_ecoverde).",
      ),
    adminEmail: z
      .string()
      .trim()
      .min(1, "Correo del admin no válido.")
      .refine((v) => z.string().email().safeParse(v).success, "Correo del admin no válido."),
    adminNombreCompleto: z
      .string()
      .trim()
      .min(3, "El nombre completo debe tener al menos 3 caracteres.")
      .max(200, "El nombre completo no puede superar los 200 caracteres."),
    adminUsername: z
      .string()
      .trim()
      .min(1, "El username es obligatorio y sin espacios.")
      .max(100, "El username no puede superar los 100 caracteres.")
      .refine((v) => !/\s/.test(v), "El username es obligatorio y sin espacios."),
    adminPassword: z.string(),
    generarPassword: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.generarPassword && data.adminPassword.length > 0 && data.adminPassword.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminPassword"],
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }
  });

export type PlataformaFormValues = z.infer<typeof plataformaSchema>;
