import { useState, useEffect } from "react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  crearConvenio,
  actualizarConvenio,
  TIPOS_CONVENIO,
  type Convenio,
  type CuerpoConvenio,
  type TipoConvenio,
} from "@/app/modules/convenios/conveniosApi";
import { listarProveedores, type Proveedor } from "@/app/modules/proveedores/proveedoresApi";
import { listarBodegas, type Bodega } from "@/app/modules/bodega/bodegasApi";
import styles from "@/app/modules/materiales/material-formulario.module.css";

interface Errores {
  [campo: string]: string;
}

const SIN_SELECCION = "__ninguno__";

const ETIQUETAS_TIPO: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  INTERCAMBIO: "Intercambio",
  SERVICIO: "Servicio",
};

export function ConvenioFormulario({
  convenio,
  alGuardar,
  alCerrar,
}: {
  convenio?: Convenio | null;
  alGuardar: (resultado: Convenio) => void;
  alCerrar: () => void;
}) {
  const esEdicion = Boolean(convenio);

  const [nombre, setNombre] = useState(convenio?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoConvenio | "">(convenio?.tipo ?? "");
  const [proveedorId, setProveedorId] = useState(convenio?.proveedorId ?? SIN_SELECCION);
  const [bodegaId, setBodegaId] = useState(convenio?.bodegaId ?? SIN_SELECCION);
  const [fechaInicio, setFechaInicio] = useState(convenio?.fechaInicio?.slice(0, 10) ?? "");
  const [fechaFin, setFechaFin] = useState(convenio?.fechaFin?.slice(0, 10) ?? "");
  const [valorTotal, setValorTotal] = useState(
    convenio?.valorTotal != null ? String(convenio.valorTotal) : "",
  );
  const [responsable, setResponsable] = useState(convenio?.responsable ?? "");
  const [descripcion, setDescripcion] = useState(convenio?.descripcion ?? "");

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);

  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarProveedores({ estado: "ACTIVO", size: 200 }).then((p) => setProveedores(p.content)).catch(() => {});
    listarBodegas({ estado: "ACTIVA", size: 200 }).then((b) => setBodegas(b.content)).catch(() => {});
  }, []);

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombre.trim().length < 3) nuevos.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!tipo) nuevos.tipo = "Selecciona el tipo de convenio.";
    if (!fechaInicio) nuevos.fechaInicio = "La fecha de inicio es obligatoria.";
    if (fechaFin && fechaInicio && fechaFin < fechaInicio) {
      nuevos.fechaFin = "La fecha de fin no puede ser anterior a la de inicio.";
    }
    if (valorTotal !== "" && (Number.isNaN(parseFloat(valorTotal)) || parseFloat(valorTotal) < 0)) {
      nuevos.valorTotal = "El valor debe ser un número positivo.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    const cuerpo: CuerpoConvenio = {
      nombre: nombre.trim(),
      tipo: tipo as TipoConvenio,
      proveedorId: proveedorId === SIN_SELECCION ? null : proveedorId,
      bodegaId: bodegaId === SIN_SELECCION ? null : bodegaId,
      fechaInicio,
      fechaFin: fechaFin || null,
      valorTotal: valorTotal === "" ? null : parseFloat(valorTotal),
      responsable: responsable.trim() || null,
      descripcion: descripcion.trim() || null,
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarConvenio(convenio!.id, cuerpo)
        : await crearConvenio(cuerpo);
      alGuardar(resultado);
    } catch (error: any) {
      const estado = error?.response?.status;
      if (estado === 409) setErrorGeneral("Ya existe un convenio con ese código.");
      else if (estado === 400) setErrorGeneral("Revisa los datos del formulario.");
      else if (estado === 403) setErrorGeneral("No tienes permisos para esta acción.");
      else if (estado === 404) setErrorGeneral("El convenio no existe o fue eliminado.");
      else setErrorGeneral("Ocurrió un error al guardar el convenio. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.fila}>
        <div className={`${styles.campo} ${styles.campoAncho}`}>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Convenio de compra de PET 2025"
          />
          {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Tipo *</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConvenio)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CONVENIO.map((t) => (
                <SelectItem key={t} value={t}>
                  {ETIQUETAS_TIPO[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.tipo && <span className={styles.errorCampo}>{errores.tipo}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Proveedor</Label>
          <Select value={proveedorId} onValueChange={setProveedorId}>
            <SelectTrigger>
              <SelectValue placeholder="Sin proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_SELECCION}>Sin proveedor</SelectItem>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.campo}>
          <Label>Bodega</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
            <SelectTrigger>
              <SelectValue placeholder="Sin bodega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_SELECCION}>Sin bodega</SelectItem>
              {bodegas.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="fechaInicio">Fecha de inicio *</Label>
          <Input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          {errores.fechaInicio && <span className={styles.errorCampo}>{errores.fechaInicio}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="fechaFin">Fecha de fin</Label>
          <Input
            id="fechaFin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          {errores.fechaFin && <span className={styles.errorCampo}>{errores.fechaFin}</span>}
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label htmlFor="valorTotal">Valor total (COP)</Label>
          <Input
            id="valorTotal"
            type="number"
            step="0.01"
            min="0"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            placeholder="5000000.00"
          />
          {errores.valorTotal && <span className={styles.errorCampo}>{errores.valorTotal}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="responsable">Responsable</Label>
          <Input
            id="responsable"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Juan Pérez"
          />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="descripcion">Descripción / Condiciones</Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe las condiciones, términos y alcance del convenio..."
          rows={3}
        />
      </div>

      <div className={styles.acciones}>
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear convenio"}
        </Button>
      </div>
    </form>
  );
}
