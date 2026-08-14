import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { listarProveedores, type Proveedor } from "@/app/modules/proveedores/proveedoresApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import { listarMateriales, type Material } from "@/app/modules/materiales/materialesApi";
import { interpretarErrorHttp } from "@/app/http/errores";
import {
  entregaSchema,
  type EntregaFormInput,
  type EntregaFormOutput,
} from "@/app/modules/entregas/entregaSchema";
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function EntregaFormulario({
  alGuardar,
  alCerrar,
}: {
  alGuardar: (resultado: Entrega) => void;
  alCerrar: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EntregaFormInput, unknown, EntregaFormOutput>({
    resolver: zodResolver(entregaSchema),
    defaultValues: {
      proveedorId: "",
      bodegaId: "",
      tipoMaterialId: "",
      pesoKg: "",
      personaEntrega: "",
      fechaRecepcion: "",
    },
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [provs, bods, mats] = await Promise.all([
          listarProveedores({ estado: "ACTIVO", size: 100 }),
          listarBodegas({ estado: "ACTIVA", size: 100 }),
          listarMateriales({ activo: "true", size: 100 }),
        ]);
        setProveedores(provs.content);
        setBodegas(bods.content);
        setMateriales(mats.content);
      } catch {
        setErrorGeneral("No se pudieron cargar los catálogos del formulario.");
      }
    })();
  }, []);

  async function onSubmit(valores: EntregaFormOutput) {
    setErrorGeneral(null);

    const cuerpo: CuerpoEntrega = {
      proveedorId: valores.proveedorId,
      bodegaId: valores.bodegaId,
      tipoMaterialId: valores.tipoMaterialId,
      pesoKg: valores.pesoKg,
      personaEntrega: valores.personaEntrega.trim() || null,
      fechaRecepcion: valores.fechaRecepcion || null,
    };

    setEnviando(true);
    try {
      const resultado = await registrarEntrega(cuerpo);
      alGuardar(resultado);
    } catch (error) {
      setErrorGeneral(interpretarErrorHttp(error, {
        409: "El proveedor no está activo o la operación no es válida.",
      }, "No se pudo registrar la entrega. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label>Proveedor *</Label>
        <Controller
          name="proveedorId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor (solo activos)" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.proveedorId && <span className={styles.errorCampo}>{errors.proveedorId.message}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Bodega *</Label>
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
        <div className={styles.campo}>
          <Label>Material *</Label>
          <Controller
            name="tipoMaterialId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona material" />
                </SelectTrigger>
                <SelectContent>
                  {materiales.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipoMaterialId && <span className={styles.errorCampo}>{errors.tipoMaterialId.message}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="pesoKg">Peso (kg) *</Label>
          <Input
            id="pesoKg"
            type="number"
            step="0.01"
            min="0"
            {...register("pesoKg")}
            placeholder="1200.00"
          />
          {errors.pesoKg && <span className={styles.errorCampo}>{errors.pesoKg.message}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="fechaRecepcion">Fecha de recepción</Label>
          <Input
            id="fechaRecepcion"
            type="datetime-local"
            {...register("fechaRecepcion")}
          />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="personaEntrega">Persona que entrega</Label>
        <Input
          id="personaEntrega"
          {...register("personaEntrega")}
          placeholder="Carlos Ruiz"
        />
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
