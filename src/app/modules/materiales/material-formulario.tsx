import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  obtenerCategorias,
  obtenerSubcategorias,
  obtenerResinas,
  obtenerColores,
  crearMaterial,
  actualizarMaterial,
  CATEGORIA_PLASTICO,
  type Material,
  type OpcionCatalogo,
  type CuerpoMaterial,
} from "@/app/modules/materiales/materialesApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import {
  materialSchema,
  UNIDADES_MEDIDA,
  UNIDADES_EMPAQUE,
  type MaterialFormInput,
  type MaterialFormOutput,
} from "@/app/modules/materiales/materialSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function MaterialFormulario({
  material,
  alGuardar,
  alCerrar,
}: {
  material?: Material | null;
  alGuardar: (resultado: Material) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(material);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaterialFormInput, unknown, MaterialFormOutput>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      nombre: material?.nombre ?? "",
      categoriaCodigo: material?.categoriaCodigo ?? "",
      subcategoriaCodigo: material?.subcategoriaCodigo ?? "",
      resinaCodigo: material?.resinaCodigo ?? "",
      colorCodigo: material?.colorCodigo ?? "",
      unidadMedida: material?.unidadMedida ?? "",
      unidadEmpaque: material?.unidadEmpaque ?? "",
      precioBase: material ? String(material.precioBase) : "",
      factorCalidad: material ? String(material.factorCalidad) : "1.00",
      umbralMerma: material?.umbralMerma != null ? String(material.umbralMerma) : "",
    },
  });

  const categoriaCodigo = watch("categoriaCodigo");

  const [categorias, setCategorias] = useState<OpcionCatalogo[]>([]);
  const [subcategorias, setSubcategorias] = useState<OpcionCatalogo[]>([]);
  const [resinas, setResinas] = useState<OpcionCatalogo[]>([]);
  const [colores, setColores] = useState<OpcionCatalogo[]>([]);

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const esPlastico = categoriaCodigo === CATEGORIA_PLASTICO;

  // Carga catálogos base.
  useEffect(() => {
    (async () => {
      try {
        const [cats, res, cols] = await Promise.all([
          obtenerCategorias(),
          obtenerResinas(),
          obtenerColores(),
        ]);
        setCategorias(cats);
        setResinas(res);
        setColores(cols);
      } catch {
        setErrorGeneral("No se pudieron cargar los catálogos del formulario.");
      }
    })();
  }, []);

  // Recarga subcategorías cada vez que cambia la categoría.
  useEffect(() => {
    if (!categoriaCodigo) {
      setSubcategorias([]);
      return;
    }
    (async () => {
      try {
        const subs = await obtenerSubcategorias(categoriaCodigo);
        setSubcategorias(subs);
      } catch {
        setSubcategorias([]);
      }
    })();
  }, [categoriaCodigo]);

  // Si la categoría deja de ser PLASTICO, se limpian resina y color.
  useEffect(() => {
    if (!esPlastico) {
      setValue("resinaCodigo", "");
      setValue("colorCodigo", "");
    }
  }, [esPlastico, setValue]);

  function manejarCambioCategoria(valor: string, onChange: (v: string) => void) {
    onChange(valor);
    setValue("subcategoriaCodigo", ""); // se reinicia al cambiar categoría
  }

  async function onSubmit(valores: MaterialFormOutput) {
    setErrorGeneral(null);

    // Regla de negocio: resina y color solo se envían si la categoría es PLASTICO.
    const cuerpo: CuerpoMaterial = {
      nombre: valores.nombre.trim(),
      categoriaCodigo: valores.categoriaCodigo,
      subcategoriaCodigo: valores.subcategoriaCodigo || null,
      codigoResinaCodigo: esPlastico ? valores.resinaCodigo || null : null,
      colorCodigo: esPlastico ? valores.colorCodigo || null : null,
      unidadMedida: valores.unidadMedida,
      unidadEmpaque: valores.unidadEmpaque,
      precioBase: valores.precioBase,
      factorCalidad: valores.factorCalidad,
      umbralMerma: valores.umbralMerma === "" ? null : parseFloat(valores.umbralMerma),
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarMaterial(material!.id, cuerpo)
        : await crearMaterial(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        404: "El material no existe o fue eliminado.",
      }, "Ocurrió un error al guardar el material. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" {...register("nombre")} placeholder="PET Cristal" />
        {errors.nombre && <span className={styles.errorCampo}>{errors.nombre.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Categoría *</Label>
          <Controller
            name="categoriaCodigo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => manejarCambioCategoria(v, field.onChange)}>
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
            )}
          />
          {errors.categoriaCodigo && (
            <span className={styles.errorCampo}>{errors.categoriaCodigo.message}</span>
          )}
        </div>
        <div className={styles.campo}>
          <Label>Subcategoría</Label>
          <Controller
            name="subcategoriaCodigo"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!categoriaCodigo || subcategorias.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {subcategorias.map((s) => (
                    <SelectItem key={s.codigo} value={s.codigo}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Resina</Label>
          <Controller
            name="resinaCodigo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!esPlastico}>
                <SelectTrigger>
                  <SelectValue placeholder={esPlastico ? "Selecciona resina" : "Solo para plástico"} />
                </SelectTrigger>
                <SelectContent>
                  {resinas.map((r) => (
                    <SelectItem key={r.codigo} value={r.codigo}>
                      {r.codigo} · {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className={styles.campo}>
          <Label>Color</Label>
          <Controller
            name="colorCodigo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!esPlastico}>
                <SelectTrigger>
                  <SelectValue placeholder={esPlastico ? "Selecciona color" : "Solo para plástico"} />
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
      {!esPlastico && (
        <p className={styles.notaRegla}>
          Resina y color solo aplican cuando la categoría es Plástico.
        </p>
      )}

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Unidad de medida *</Label>
          <Controller
            name="unidadMedida"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unidadMedida && (
            <span className={styles.errorCampo}>{errors.unidadMedida.message}</span>
          )}
        </div>
        <div className={styles.campo}>
          <Label>Unidad de empaque *</Label>
          <Controller
            name="unidadEmpaque"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona empaque" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_EMPAQUE.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unidadEmpaque && (
            <span className={styles.errorCampo}>{errors.unidadEmpaque.message}</span>
          )}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="precioBase">Precio base *</Label>
          <Input
            id="precioBase"
            type="number"
            step="0.01"
            min="0"
            {...register("precioBase")}
            placeholder="1200.00"
          />
          {errors.precioBase && <span className={styles.errorCampo}>{errors.precioBase.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="factorCalidad">Factor de calidad *</Label>
          <Input
            id="factorCalidad"
            type="number"
            step="0.01"
            min="0"
            {...register("factorCalidad")}
            placeholder="1.00"
          />
          {errors.factorCalidad && (
            <span className={styles.errorCampo}>{errors.factorCalidad.message}</span>
          )}
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="umbralMerma">Umbral de merma (%)</Label>
        <Input
          id="umbralMerma"
          type="number"
          step="0.01"
          min="0"
          max="100"
          {...register("umbralMerma")}
          placeholder="5.00"
        />
        {errors.umbralMerma && <span className={styles.errorCampo}>{errors.umbralMerma.message}</span>}
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear material"}
        </Button>
      </div>
    </form>
  );
}
