import { useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { interpretarErrorHttp } from "@/app/http/errores";
import { registrarIngreso } from "@/app/modules/ingresos/ingresosApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import { listarMateriales, type Material as MaterialCatalogo } from "@/app/modules/materiales/materialesApi";
import { ingresoSchema, type IngresoFormValues } from "@/app/modules/ingresos/ingresoSchema";
import styles from "@/app/modules/ingresos/ingreso-form.module.css";

const FILA_VACIA = {
  materialId: "",
  pesoBruto: "",
  tara: "",
  precioKilo: "",
  observaciones: "",
};

const num = (v: string) => parseFloat(v) || 0;
const neto = (m: { pesoBruto: string; tara: string }) => Math.max(num(m.pesoBruto) - num(m.tara), 0);
const total = (m: { pesoBruto: string; tara: string; precioKilo: string }) => neto(m) * num(m.precioKilo);
const fmt = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function IngresoForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<IngresoFormValues>({
    resolver: zodResolver(ingresoSchema),
    defaultValues: {
      cedula: "",
      nombreCliente: "",
      bodegaDestinoId: "",
      encargado: localStorage.getItem("recyops_nombre") ?? "",
      placa: "",
      materiales: [FILA_VACIA],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "materiales" });
  // useWatch para recalcular neto/total/gran total en cada tecleo (los inputs de
  // la fila son no-controlados vía register(), fields[] de useFieldArray no
  // refleja esos cambios en vivo).
  const materialesWatch = useWatch({ control, name: "materiales" }) ?? [];

  // Catálogos que vienen del backend
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [catalogo, setCatalogo] = useState<MaterialCatalogo[]>([]);

  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const timeoutNavegacion = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si el usuario abandona la vista antes de la redirección, no navegar.
  useEffect(() => {
    return () => {
      if (timeoutNavegacion.current) clearTimeout(timeoutNavegacion.current);
    };
  }, []);

  useEffect(() => {
    listarBodegas({ estado: "ACTIVA", size: 100 })
      .then((pagina) => setBodegas(pagina.content))
      .catch(() => setBodegas([]));
    listarMateriales({ activo: "true", size: 100 })
      .then((pagina) => setCatalogo(pagina.content))
      .catch(() => setCatalogo([]));
  }, []);

  // Elegir un material del catálogo precarga su precio base (editable).
  function seleccionarMaterial(index: number, materialId: string) {
    const mat = catalogo.find((c) => c.id === materialId);
    setValue(`materiales.${index}.materialId`, materialId);
    setValue(`materiales.${index}.precioKilo`, mat ? String(mat.precioBase) : "");
  }

  const granTotal = materialesWatch.reduce((acc, m) => acc + total(m), 0);
  const pesoNetoTotal = materialesWatch.reduce((acc, m) => acc + neto(m), 0);

  const errorMateriales = errors.materiales?.root?.message ?? errors.materiales?.message;

  async function onSubmit(valores: IngresoFormValues) {
    if (exito) return;
    setErrorGeneral(null);
    setExito(false);

    const materialesValidos = valores.materiales.filter((m) => m.materialId && neto(m) > 0);

    setEnviando(true);
    try {
      await registrarIngreso({
        cliente: valores.nombreCliente.trim(),
        cedula: valores.cedula.trim(),
        bodegaDestinoId: valores.bodegaDestinoId,
        encargado: valores.encargado.trim(),
        placaVehiculo: valores.placa.trim() || null,
        pesoNetoTotal: Number(pesoNetoTotal.toFixed(2)),
        total: Number(granTotal.toFixed(2)),
        materiales: materialesValidos.map((m) => ({
          materialId: m.materialId,
          pesoBruto: num(m.pesoBruto),
          tara: num(m.tara),
          precioKilo: num(m.precioKilo),
          observaciones: m.observaciones.trim() || null,
        })),
      });
      // exito mantiene el botón deshabilitado hasta la navegación (evita doble envío).
      setExito(true);
      toast.success("Ingreso registrado", { description: "Abriendo el historial..." });
      // Al historial, donde el ingreso recién creado aparece de primero.
      timeoutNavegacion.current = setTimeout(() => navigate("/ingreso/historial"), 900);
    } catch (e) {
      setErrorGeneral(
        interpretarErrorHttp(
          e,
          {},
          "No se pudo registrar el ingreso. Revisa la conexión con el servidor.",
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      {/* Cliente */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cliente</h2>
        <p className={styles.sectionDesc}>Datos de la persona o entidad que entrega el material.</p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <Label htmlFor="cedula">Número de cédula *</Label>
            <Input
              id="cedula"
              aria-invalid={!!errors.cedula}
              aria-describedby={errors.cedula ? "cedula-error" : undefined}
              className={styles.mono}
              placeholder="1.020.345.678"
              {...register("cedula")}
            />
            {errors.cedula && <span id="cedula-error" role="alert" className={styles.errorCampo}>{errors.cedula.message}</span>}
          </div>
          <div className={styles.field}>
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              aria-invalid={!!errors.nombreCliente}
              aria-describedby={errors.nombreCliente ? "nombreCliente-error" : undefined}
              placeholder="Ana Torres"
              {...register("nombreCliente")}
            />
            {errors.nombreCliente && <span id="nombreCliente-error" role="alert" className={styles.errorCampo}>{errors.nombreCliente.message}</span>}
          </div>
          <div className={styles.field}>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" className={styles.mono} placeholder="300 123 4567" />
          </div>
          <div className={styles.field}>
            <Label htmlFor="correo">Correo electrónico</Label>
            <Input id="correo" type="email" placeholder="cliente@correo.com" />
          </div>
        </div>
      </section>

      {/* Procedencia y recepción */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Procedencia y recepción</h2>
        <p className={styles.sectionDesc}>Origen del material y datos de recepción en bodega.</p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <Label>Entidad con convenio</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecorecicla">EcoRecicla S.A.S.</SelectItem>
                <SelectItem value="verde-andino">Verde Andino</SelectItem>
                <SelectItem value="reciclamos">Reciclamos Ltda.</SelectItem>
                <SelectItem value="particular">Particular (sin convenio)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={styles.field}>
            <Label htmlFor="departamento">Departamento</Label>
            <Input id="departamento" placeholder="Cundinamarca" />
          </div>
          <div className={styles.field}>
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" placeholder="Bogotá" />
          </div>
          <div className={styles.field}>
            <Label htmlFor="lugar">Lugar específico</Label>
            <Input id="lugar" placeholder="Calle 80 # 12-34, Bodega 5" />
          </div>
          <div className={styles.field}>
            <Label htmlFor="bodegaDestinoId">Bodega destino *</Label>
            <Controller
              name="bodegaDestinoId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="bodegaDestinoId" aria-invalid={!!errors.bodegaDestinoId} aria-describedby={errors.bodegaDestinoId ? "bodegaDestinoId-error" : undefined}>
                    <SelectValue
                      placeholder={bodegas.length ? "Selecciona bodega" : "Sin bodegas disponibles"}
                    />
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
            {errors.bodegaDestinoId && (
              <span id="bodegaDestinoId-error" role="alert" className={styles.errorCampo}>{errors.bodegaDestinoId.message}</span>
            )}
          </div>
          <div className={styles.field}>
            <Label htmlFor="encargado">Encargado de recepción *</Label>
            <Input
              id="encargado"
              aria-invalid={!!errors.encargado}
              aria-describedby={errors.encargado ? "encargado-error" : undefined}
              placeholder="Carlos Méndez"
              {...register("encargado")}
            />
            {errors.encargado && <span id="encargado-error" role="alert" className={styles.errorCampo}>{errors.encargado.message}</span>}
          </div>
          <div className={styles.field}>
            <Label htmlFor="fecha">Fecha y hora</Label>
            <Input id="fecha" type="datetime-local" className={styles.mono} />
          </div>
          <div className={styles.field}>
            <Label htmlFor="placa">Placa del vehículo</Label>
            <Input
              id="placa"
              className={styles.mono}
              placeholder="ABC-123"
              {...register("placa")}
            />
          </div>
        </div>
      </section>

      {/* Materiales */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Materiales</h2>
        <p className={styles.sectionDesc}>
          El peso neto y el total se calculan automáticamente por material.
        </p>

        {errorMateriales && <div role="alert" className={styles.errorCampo}>{errorMateriales}</div>}

        {fields.map((field, index) => {
          const filaActual = materialesWatch[index] ?? FILA_VACIA;
          const erroresFila = errors.materiales?.[index];
          return (
            <div key={field.id} className={styles.material}>
              <div className={styles.materialHead}>
                <span className={styles.materialLabel}>Material #{index + 1}</span>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    Eliminar
                  </Button>
                )}
              </div>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <Label htmlFor={`mat-${field.id}-material`}>Material</Label>
                  {catalogo.length > 0 ? (
                    <Controller
                      name={`materiales.${index}.materialId`}
                      control={control}
                      render={({ field: selectField }) => (
                        <Select
                          value={selectField.value}
                          onValueChange={(v) => seleccionarMaterial(index, v)}
                        >
                          <SelectTrigger id={`mat-${field.id}-material`} aria-invalid={!!erroresFila?.materialId} aria-describedby={erroresFila?.materialId ? `mat-${field.id}-material-error` : undefined}>
                            <SelectValue placeholder="Selecciona material" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogo.map((mat) => (
                              <SelectItem key={mat.id} value={mat.id}>
                                {mat.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  ) : (
                    <div className={styles.computed}>No hay materiales configurados en el catálogo</div>
                  )}
                  {erroresFila?.materialId && (
                    <span id={`mat-${field.id}-material-error`} role="alert" className={styles.errorCampo}>{erroresFila.materialId.message}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <Label htmlFor={`mat-${field.id}-bruto`}>Peso bruto (kg)</Label>
                  <Input
                    id={`mat-${field.id}-bruto`}
                    aria-invalid={!!erroresFila?.pesoBruto}
                    aria-describedby={erroresFila?.pesoBruto ? `mat-${field.id}-bruto-error` : undefined}
                    type="number"
                    step="0.01"
                    className={styles.mono}
                    {...register(`materiales.${index}.pesoBruto`)}
                    placeholder="0.00"
                  />
                  {erroresFila?.pesoBruto && (
                    <span id={`mat-${field.id}-bruto-error`} role="alert" className={styles.errorCampo}>{erroresFila.pesoBruto.message}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <Label htmlFor={`mat-${field.id}-tara`}>Tara (kg)</Label>
                  <Input
                    id={`mat-${field.id}-tara`}
                    aria-invalid={!!erroresFila?.tara}
                    aria-describedby={erroresFila?.tara ? `mat-${field.id}-tara-error` : undefined}
                    type="number"
                    step="0.01"
                    className={styles.mono}
                    {...register(`materiales.${index}.tara`)}
                    placeholder="0.00"
                  />
                  {erroresFila?.tara && (
                    <span id={`mat-${field.id}-tara-error`} role="alert" className={styles.errorCampo}>{erroresFila.tara.message}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <Label>Peso neto (kg)</Label>
                  <div className={styles.computed}>{fmt(neto(filaActual))}</div>
                </div>
                <div className={styles.field}>
                  <Label htmlFor={`mat-${field.id}-precio`}>Precio por kilo</Label>
                  <Input
                    id={`mat-${field.id}-precio`}
                    aria-invalid={!!erroresFila?.precioKilo}
                    aria-describedby={erroresFila?.precioKilo ? `mat-${field.id}-precio-error` : undefined}
                    type="number"
                    step="0.01"
                    className={styles.mono}
                    {...register(`materiales.${index}.precioKilo`)}
                    placeholder="0.00"
                  />
                  {erroresFila?.precioKilo && (
                    <span id={`mat-${field.id}-precio-error`} role="alert" className={styles.errorCampo}>{erroresFila.precioKilo.message}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <Label>Total</Label>
                  <div className={styles.computed}>$ {fmt(total(filaActual))}</div>
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <Label htmlFor={`mat-${field.id}-obs`}>Observaciones del material</Label>
                  <Textarea
                    id={`mat-${field.id}-obs`}
                    rows={2}
                    {...register(`materiales.${index}.observaciones`)}
                    placeholder="Estado, humedad, contaminación, etc."
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={() => append(FILA_VACIA)}>
          + Agregar material
        </Button>
      </section>

      {/* Observaciones generales */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Observaciones generales</h2>
        <p className={styles.sectionDesc}>Notas que aplican a todo el ingreso.</p>
        <Textarea rows={4} placeholder="Observaciones generales del ingreso..." />
      </section>

      <div className={styles.actions}>
        <div className={styles.summary}>
          Peso neto: <strong>{fmt(pesoNetoTotal)} kg</strong>
          {" · "}
          Total ingreso: <strong>$ {fmt(granTotal)}</strong>
        </div>
        {errorGeneral && (
          <span role="alert" style={{ color: "#c0392b", fontSize: 13 }}>
            {errorGeneral}
          </span>
        )}
        <Button type="submit" disabled={enviando || exito} aria-busy={enviando}>
          {enviando ? "Registrando..." : exito ? "Ingreso registrado" : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
