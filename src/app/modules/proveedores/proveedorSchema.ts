import { z } from "zod";

/**
 * Replica CuerpoProveedor (backend):
 *   nombre @NotBlank, nit @NotBlank, contacto (libre), telefono (libre),
 *   email @Email, direccion (libre).
 *
 * "nombre" min 3 caracteres es una regla solo-frontend (mas estricta que
 * @NotBlank) que ya existia, se conserva.
 */
export const proveedorSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  nit: z.string().trim().min(1, "El NIT es obligatorio."),
  contacto: z.string().trim(),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "El teléfono solo puede contener números."),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ingresa un correo con formato válido."),
  direccion: z.string().trim(),
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;
