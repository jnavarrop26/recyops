import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { registrarEntrega, type Entrega, type CuerpoEntrega } from "@/app/modules/entregas/entregasApi";
import { listarConvenios, type Convenio } from "@/app/modules/convenios/conveniosApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import { obtenerTrabajadores, type Trabajador } from "@/app/modules/trabajadores/trabajadoresApi";
import { obtenerTodo } from "@/app/http/paginacion";
import {
  obtenerCategorias,
  obtenerResinas,
  obtenerColores,
  listarMateriales,
  CATEGORIA_PLASTICO,
  type OpcionCatalogo,
  type Material,
} from "@/app/modules/materiales/materialesApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import {
  crearEntregaSchema,
  resolverMaterialLinea,
  type EntregaFormInput,
  type EntregaFormOutput,
} from "@/app/modules/entregas/entregaSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";
import lineaStyles from "@/app/modules/entregas/entrega-formulario.module.css";

const LINEA_VACIA = {
  categoriaCodigo: "",
  resinaCodigo: "",
  colorCodigo: "",
  materialIdDirecto: "",
  pesoKg: "",
};

export function EntregaFormulario({
  alGuardar,
  alCerrar,
}: {
  alGuardar: (resultado: Entrega) => void;
  alCerrar: () => void;
}) {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [categorias, setCategorias] = useState<OpcionCatalogo[]>([]);
  const [resinas, setResinas] = useState<OpcionCatalogo[]>([]);
  const [colores, setColores] = useState<OpcionCatalogo[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EntregaFormInput, unknown, EntregaFormOutput>({
    resolver: zodResolver(crearEntregaSchema(materiales)),
    defaultValues: {
      convenioId: "",
      bodegaId: "",
      personaEntregaId: "",
      fechaRecepcion: "",
      lineas: [LINEA_VACIA],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });
  // useWatch para leer valores en vivo de las líneas (categoría/resina/color
  // controlan qué se muestra y cómo se resuelve el material) y para el total.
  const lineasVigentes = useWatch({ control, name: "lineas" }) ?? [];
  const personaEntregaId = useWatch({ control, name: "personaEntregaId" });

  useEffect(() => {
    (async () => {
      try {
        const [conv, bods, trabs, cats, res, cols, mats] = await Promise.all([
          obtenerTodo((page, size) => listarConvenios({ estado: "ACTIVO", page, size })),
          obtenerTodo((page, size) => listarBodegas({ estado: "ACTIVA", page, size })),
          obtenerTrabajadores(),
          obtenerCategorias(),
          obtenerResinas(),
          obtenerColores(),
          obtenerTodo((page, size) => listarMateriales({ activo: "true", page, size })),
        ]);
        setConvenios(conv);
        setBodegas(bods);
        setTrabajadores(trabs.filter((t) => t.estado === "ACTIVO"));
        setCategorias(cats);
        setResinas(res);
        setColores(cols);
        setMateriales(mats);
      } catch {
        setErrorGeneral("No se pudieron cargar los catálogos del formulario.");
      }
    })();
  }, []);

  const personaSeleccionada = trabajadores.find((t) => t.id === personaEntregaId);
  const totalKg = lineasVigentes.reduce((acc, l) => acc + (Number(l?.pesoKg) || 0), 0);

  function manejarCambioCategoriaLinea(indice: number, valor: string) {
    setValue(`lineas.${indice}.categoriaCodigo`, valor);
    setValue(`lineas.${indice}.resinaCodigo`, "");
    setValue(`lineas.${indice}.colorCodigo`, "");
    setValue(`lineas.${indice}.materialIdDirecto`, "");
  }

  function manejarCambioResinaLinea(indice: number, valor: string) {
    setValue(`lineas.${indice}.resinaCodigo`, valor);
    setValue(`lineas.${indice}.colorCodigo`, "");
  }

  async function onSubmit(valores: EntregaFormOutput) {
    setErrorGeneral(null);

    const cuerpo: CuerpoEntrega = {
      convenioId: valores.convenioId,
      bodegaId: valores.bodegaId,
      personaEntregaId: valores.personaEntregaId,
      fechaRecepcion: valores.fechaRecepcion || null,
      lineas: valores.lineas.map((linea) => {
        // El schema ya garantizó que cada línea resuelve a un material real.
        const material = resolverMaterialLinea(materiales, linea)!;
        return { tipoMaterialId: material.id, pesoKg: linea.pesoKg };
      }),
    };

    setEnviando(true);
    try {
      const resultado = await registrarEntrega(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "El convenio no está activo o la operación no es válida.",
      }, "No se pudo registrar la entrega. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label>Convenio *</Label>
        <Controller
          name="convenioId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona convenio (solo activos)" />
              </SelectTrigger>
              <SelectContent>
                {convenios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} · {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.convenioId && <span className={styles.errorCampo}>{errors.convenioId.message}</span>}
      </div>

      <div className={styles.campo}>
        <Label>Bodega de origen *</Label>
        <Controller
          name="bodegaId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona bodega" />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.bodegaId && <span className={styles.errorCampo}>{errors.bodegaId.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Persona que entrega *</Label>
          <Controller
            name="personaEntregaId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {trabajadores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.personaEntregaId && (
            <span className={styles.errorCampo}>{errors.personaEntregaId.message}</span>
          )}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="cedulaAuto">Cédula (automática)</Label>
          <Input id="cedulaAuto" value={personaSeleccionada?.cedula ?? ""} readOnly placeholder="—" />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="fechaRecepcion">Fecha y hora</Label>
        <Input id="fechaRecepcion" type="datetime-local" {...register("fechaRecepcion")} />
      </div>

      <div className={lineaStyles.seccionLineas}>
        <h3 className={lineaStyles.tituloSeccion}>Líneas de material</h3>
        {errors.lineas?.message && <div className={styles.errorCampo}>{errors.lineas.message}</div>}

        {fields.map((field, indice) => {
          const lineaActual = lineasVigentes[indice] ?? LINEA_VACIA;
          const esPlastico = lineaActual.categoriaCodigo === CATEGORIA_PLASTICO;
          const materialesDeCategoria = materiales.filter(
            (m) => m.categoriaCodigo === lineaActual.categoriaCodigo,
          );
          const errorLinea = (errors.lineas?.[indice] as { root?: { message?: string } } | undefined)?.root
            ?.message;

          return (
            <div key={field.id} className={lineaStyles.linea}>
              <div className={lineaStyles.lineaHead}>
                <span className={lineaStyles.lineaLabel}>Línea {indice + 1}</span>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(indice)}>
                    Quitar línea
                  </Button>
                )}
              </div>

              <div className={styles.campo}>
                <Label>Categoría *</Label>
                <Select
                  value={lineaActual.categoriaCodigo}
                  onValueChange={(v) => manejarCambioCategoriaLinea(indice, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.codigo} value={c.codigo}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {esPlastico && (
                <div className={styles.fila}>
                  <div className={styles.campo}>
                    <Label>Resina *</Label>
                    <Select
                      value={lineaActual.resinaCodigo}
                      onValueChange={(v) => manejarCambioResinaLinea(indice, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona resina" />
                      </SelectTrigger>
                      <SelectContent>
                        {resinas.map((r) => (
                          <SelectItem key={r.codigo} value={r.codigo}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={styles.campo}>
                    <Label>Color * <span className={styles.notaRegla}>(independiente de la resina)</span></Label>
                    <Controller
                      name={`lineas.${indice}.colorCodigo`}
                      control={control}
                      render={({ field: colorField }) => (
                        <Select value={colorField.value} onValueChange={colorField.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona color" />
                          </SelectTrigger>
                          <SelectContent>
                            {colores.map((c) => (
                              <SelectItem key={c.codigo} value={c.codigo}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              )}

              {!esPlastico && lineaActual.categoriaCodigo && (
                <div className={styles.campo}>
                  <Label>Material *</Label>
                  <Controller
                    name={`lineas.${indice}.materialIdDirecto`}
                    control={control}
                    render={({ field: matField }) => (
                      <Select value={matField.value} onValueChange={matField.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materialesDeCategoria.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

              {errorLinea && <span className={lineaStyles.avisoLinea}>⚠ {errorLinea}</span>}

              <div className={styles.campo}>
                <Label>Cantidad (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`lineas.${indice}.pesoKg`)}
                  placeholder="0.00"
                />
                {errors.lineas?.[indice]?.pesoKg && (
                  <span className={styles.errorCampo}>{errors.lineas[indice]?.pesoKg?.message}</span>
                )}
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={() => append(LINEA_VACIA)}>
          + Agregar línea
        </Button>

        <div className={lineaStyles.total}>Total: {totalKg.toFixed(2)} kg</div>
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar entrega"}
        </Button>
      </div>
    </form>
  );
}
