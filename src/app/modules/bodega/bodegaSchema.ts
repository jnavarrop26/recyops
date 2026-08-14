import { z } from "zod";
import { TIPOS_ORGANIZACION } from "@/app/modules/bodega/bodegasApi";

/**
 * Replica CuerpoBodega (backend):
 *   nombre @NotBlank, direccion @NotBlank, telefono (libre), email @Email,
 *   nit @NotBlank, latitud/longitud (Double libres), tipoOrganizacion @NotNull
 *
 * "nombre" min 3 caracteres es una regla solo-frontend (mas estricta que
 * @NotBlank) que ya existia, se conserva.
 */
export const bodegaSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  direccion: z.string().trim().min(1, "La dirección es obligatoria."),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), "El teléfono solo puede contener números."),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ingresa un correo con formato válido."),
  // Bug #2: backend exige @NotBlank en nit, el frontend nunca lo chequeaba.
  nit: z.string().trim().min(1, "El NIT es obligatorio."),
  latitud: z.string().refine((v) => v === "" || !Number.isNaN(parseFloat(v)), "Latitud inválida."),
  longitud: z.string().refine((v) => v === "" || !Number.isNaN(parseFloat(v)), "Longitud inválida."),
  tipoOrganizacion: z
    .string()
    .refine((v) => (TIPOS_ORGANIZACION as string[]).includes(v), "Selecciona el tipo de organización."),
});

export type BodegaFormValues = z.infer<typeof bodegaSchema>;
