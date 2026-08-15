import { z } from "zod";

/**
 * Un material dentro del formulario de ingreso. Los campos numéricos viajan como
 * string crudo (igual que antes) porque filas vacías/parciales son válidas — solo
 * las filas "con intención" (materialId + peso neto > 0) se validan y se envían
 * al backend; el resto se descarta en silencio (regla de negocio preexistente,
 * no impuesta por el backend).
 */
const detalleIngresoSchema = z.object({
  materialId: z.string(),
  pesoBruto: z.string(),
  tara: z.string(),
  precioKilo: z.string(),
  observaciones: z.string(),
});

const num = (v: string) => parseFloat(v) || 0;
const neto = (m: { pesoBruto: string; tara: string }) => Math.max(num(m.pesoBruto) - num(m.tara), 0);

/**
 * Replica CuerpoIngreso + CuerpoDetalleIngreso (backend):
 *   cliente/cedula/bodegaDestinoId/encargado @NotBlank/@NotNull, placaVehiculo
 *   (libre), pesoNetoTotal/total @NotNull @Positive, materiales (@NotEmpty
 *   @Valid, cada uno con materialId @NotNull, pesoBruto @NotNull @Positive,
 *   tara @NotNull @PositiveOrZero, precioKilo @PositiveOrZero).
 *
 * El inventario depende estrictamente de los ingresos (InventarioService.
 * registrarEntrada por cada material), así que el backend ya no acepta
 * materiales sin materialId — el frontend valida lo mismo.
 *
 * El filtro de materiales "válidos" (materialId + peso neto > 0) exige además
 * precioKilo > 0 — un material con peso pero precio 0 pasaría el frontend y el
 * backend lo rechazaría con 400 porque `total` (@Positive) daría 0.
 *
 * Las filas sin material seleccionado o con peso neto 0 se siguen descartando en
 * silencio (no bloquean el envío) — es una regla de negocio solo-frontend, no del
 * DTO del backend.
 */
export const ingresoSchema = z
  .object({
    cedula: z.string().trim().min(1, "Ingresa la cédula del cliente."),
    nombreCliente: z.string().trim().min(1, "Ingresa el nombre del cliente."),
    bodegaDestinoId: z.string().min(1, "Selecciona la bodega destino."),
    encargado: z.string().trim().min(1, "Indica el encargado de recepción."),
    placa: z.string(),
    materiales: z.array(detalleIngresoSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const pesoNetoTotal = data.materiales.reduce((acc, m) => acc + neto(m), 0);
    if (pesoNetoTotal <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materiales"],
        message: "Registra al menos un material con peso neto mayor a cero.",
      });
      return;
    }

    const filasConIntencion = data.materiales
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => m.materialId && neto(m) > 0);

    if (filasConIntencion.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materiales"],
        message: "Cada material necesita un material del catálogo y un peso neto mayor a cero.",
      });
      return;
    }

    for (const { m, idx } of filasConIntencion) {
      if (num(m.precioKilo) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["materiales", idx, "precioKilo"],
          message: "El precio por kilo debe ser mayor que 0.",
        });
      }
    }
  });

export type IngresoFormValues = z.infer<typeof ingresoSchema>;


