import { z } from "zod";

/** Replica CuerpoLogin (backend): username @NotBlank, password @NotBlank. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, "El usuario es obligatorio."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Replica CuerpoRecuperar (backend): email @NotBlank @Email.
 *
 * Bug #1: la validación anterior era `!correo.includes("@")`, que deja pasar
 * strings como "a@" o "a@b" sin dominio válido. Se reemplaza por z.string().email().
 */
export const recuperarSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Escribe tu correo en el campo Usuario y vuelve a intentarlo.")
    .refine((v) => z.string().email().safeParse(v).success, "Escribe tu correo en el campo Usuario y vuelve a intentarlo."),
});

export type RecuperarFormValues = z.infer<typeof recuperarSchema>;

/**
 * Replica CuerpoRestablecer (backend): accessToken @NotBlank,
 * password @NotBlank @Size(min=6).
 * "confirmacion === password" es una regla solo-frontend (el backend no recibe
 * confirmación), se conserva vía superRefine.
 */
export const restablecerSchema = z
  .object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirmacion: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmacion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmacion"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

export type RestablecerFormValues = z.infer<typeof restablecerSchema>;
