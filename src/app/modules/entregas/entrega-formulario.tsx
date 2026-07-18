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
import styles from "@/app/modules/materiales/material-formulario.module.css";

export function EntregaFormulario({
  alGuardar,
  alCerrar,
}: {
  alGuardar: (resultado: Entrega) => void;
  alCerrar: () => void;
}) {
  const [proveedorId, setProveedorId] = useState("");
  const [bodegaId, setBodegaId] = useState("");
  const [tipoMaterialId, setTipoMaterialId] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [personaEntrega, setPersonaEntrega] = useState("");
  const [fechaRecepcion, setFechaRecepcion] = useState("");

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  const [errores, setErrores] = useState<{ [k: string]: string }>({});
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

  function validar(): boolean {
    const e: { [k: string]: string } = {};
    if (!proveedorId) e.proveedorId = "Selecciona un proveedor.";
    if (!bodegaId) e.bodegaId = "Selecciona una bodega.";
    if (!tipoMaterialId) e.tipoMaterialId = "Selecciona un material.";
    const peso = parseFloat(pesoKg);
    if (pesoKg === "" || Number.isNaN(peso) || peso <= 0) e.pesoKg = "El peso debe ser mayor que 0.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    const cuerpo: CuerpoEntrega = {
      proveedorId,
      bodegaId,
      tipoMaterialId,
      pesoKg: parseFloat(pesoKg),
      personaEntrega: personaEntrega.trim() || null,
      fechaRecepcion: fechaRecepcion || null,
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
    <form className={styles.formulario} onSubmit={enviar}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label>Proveedor *</Label>
        <Select value={proveedorId} onValueChange={setProveedorId}>
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
        {errores.proveedorId && <span className={styles.errorCampo}>{errores.proveedorId}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Bodega *</Label>
          <Select value={bodegaId} onValueChange={setBodegaId}>
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
          {errores.bodegaId && <span className={styles.errorCampo}>{errores.bodegaId}</span>}
        </div>
        <div className={styles.campo}>
          <Label>Material *</Label>
          <Select value={tipoMaterialId} onValueChange={setTipoMaterialId}>
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
          {errores.tipoMaterialId && <span className={styles.errorCampo}>{errores.tipoMaterialId}</span>}
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
            value={pesoKg}
            onChange={(e) => setPesoKg(e.target.value)}
            placeholder="1200.00"
          />
          {errores.pesoKg && <span className={styles.errorCampo}>{errores.pesoKg}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="fechaRecepcion">Fecha de recepción</Label>
          <Input
            id="fechaRecepcion"
            type="datetime-local"
            value={fechaRecepcion}
            onChange={(e) => setFechaRecepcion(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.campo}>
        <Label htmlFor="personaEntrega">Persona que entrega</Label>
        <Input
          id="personaEntrega"
          value={personaEntrega}
          onChange={(e) => setPersonaEntrega(e.target.value)}
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
