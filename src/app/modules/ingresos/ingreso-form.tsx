import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import { registrarIngreso } from "@/app/modules/ingresos/ingresosApi";
import { listarBodegas } from "@/app/modules/bodega/bodegasApi";
import { obtenerCategorias } from "@/app/modules/materiales/materialesApi";
import styles from "@/app/modules/ingresos/ingreso-form.module.css";

type Material = {
  id: number;
  categoria: string;
  pesoBruto: string;
  tara: string;
  precioKilo: string;
  observaciones: string;
};

// Respaldo si el catálogo del backend aún no responde.
const CATEGORIAS_RESPALDO = [
  "Cartón",
  "Papel",
  "PET",
  "HDPE",
  "Vidrio",
  "Chatarra ferrosa",
  "Aluminio",
  "Cobre",
];

function nuevoMaterial(id: number): Material {
  return { id, categoria: "", pesoBruto: "", tara: "", precioKilo: "", observaciones: "" };
}

const num = (v: string) => parseFloat(v) || 0;
const neto = (m: Material) => Math.max(num(m.pesoBruto) - num(m.tara), 0);
const total = (m: Material) => neto(m) * num(m.precioKilo);
const fmt = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function IngresoForm() {
  const navigate = useNavigate();
  const [materiales, setMateriales] = useState<Material[]>([nuevoMaterial(1)]);
  const [nextId, setNextId] = useState(2);

  // Datos del cliente / recepción que viajan al backend
  const [cedula, setCedula] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [bodegaDestino, setBodegaDestino] = useState("");
  const [encargado, setEncargado] = useState(
    () => localStorage.getItem("sicofar_nombre") ?? "",
  );
  const [placa, setPlaca] = useState("");

  // Catálogos que vienen del backend
  const [bodegas, setBodegas] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_RESPALDO);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    listarBodegas({ estado: "ACTIVA", size: 100 })
      .then((pagina) => setBodegas(pagina.content.map((b) => b.nombre)))
      .catch(() => setBodegas([]));
    obtenerCategorias()
      .then((opciones) => {
        if (opciones.length > 0) setCategorias(opciones.map((o) => o.nombre));
      })
      .catch(() => {});
  }, []);

  function update(id: number, patch: Partial<Material>) {
    setMateriales((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function addMaterial() {
    setMateriales((ms) => [...ms, nuevoMaterial(nextId)]);
    setNextId((n) => n + 1);
  }
  function removeMaterial(id: number) {
    setMateriales((ms) => (ms.length > 1 ? ms.filter((m) => m.id !== id) : ms));
  }

  const granTotal = materiales.reduce((acc, m) => acc + total(m), 0);
  const pesoNetoTotal = materiales.reduce((acc, m) => acc + neto(m), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (!cedula.trim() || !nombreCliente.trim()) {
      setError("Ingresa la cédula y el nombre del cliente.");
      return;
    }
    if (!bodegaDestino) {
      setError("Selecciona la bodega destino.");
      return;
    }
    if (!encargado.trim()) {
      setError("Indica el encargado de recepción.");
      return;
    }
    if (pesoNetoTotal <= 0) {
      setError("Registra al menos un material con peso neto mayor a cero.");
      return;
    }

    const materialesValidos = materiales.filter((m) => m.categoria && neto(m) > 0);
    if (materialesValidos.length === 0) {
      setError("Cada material necesita una categoría y un peso neto mayor a cero.");
      return;
    }

    setEnviando(true);
    try {
      await registrarIngreso({
        cliente: nombreCliente.trim(),
        cedula: cedula.trim(),
        bodegaDestino,
        encargado: encargado.trim(),
        placaVehiculo: placa.trim() || null,
        pesoNetoTotal: Number(pesoNetoTotal.toFixed(2)),
        total: Number(granTotal.toFixed(2)),
        materiales: materialesValidos.map((m) => ({
          categoria: m.categoria,
          pesoBruto: num(m.pesoBruto),
          tara: num(m.tara),
          precioKilo: num(m.precioKilo),
          observaciones: m.observaciones.trim() || null,
        })),
      });
      setExito(true);
      // Al historial, donde el ingreso recién creado aparece de primero.
      setTimeout(() => navigate("/ingreso/historial"), 900);
    } catch {
      setError("No se pudo registrar el ingreso. Revisa la conexión con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Cliente */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cliente</h2>
        <p className={styles.sectionDesc}>Datos de la persona o entidad que entrega el material.</p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <Label htmlFor="cedula">Número de cédula</Label>
            <Input
              id="cedula"
              className={styles.mono}
              placeholder="1.020.345.678"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              placeholder="Ana Torres"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
            />
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
            <Label>Bodega destino</Label>
            <Select value={bodegaDestino} onValueChange={setBodegaDestino}>
              <SelectTrigger>
                <SelectValue
                  placeholder={bodegas.length ? "Selecciona bodega" : "Sin bodegas disponibles"}
                />
              </SelectTrigger>
              <SelectContent>
                {bodegas.map((nombre) => (
                  <SelectItem key={nombre} value={nombre}>
                    {nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={styles.field}>
            <Label htmlFor="encargado">Encargado de recepción</Label>
            <Input
              id="encargado"
              placeholder="Carlos Méndez"
              value={encargado}
              onChange={(e) => setEncargado(e.target.value)}
            />
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
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
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

        {materiales.map((m, i) => (
          <div key={m.id} className={styles.material}>
            <div className={styles.materialHead}>
              <span className={styles.materialLabel}>Material #{i + 1}</span>
              {materiales.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(m.id)}>
                  Eliminar
                </Button>
              )}
            </div>
            <div className={styles.grid}>
              <div className={styles.field}>
                <Label>Categoría</Label>
                <Select value={m.categoria} onValueChange={(v) => update(m.id, { categoria: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={styles.field}>
                <Label>Peso bruto (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className={styles.mono}
                  value={m.pesoBruto}
                  onChange={(e) => update(m.id, { pesoBruto: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className={styles.field}>
                <Label>Tara (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className={styles.mono}
                  value={m.tara}
                  onChange={(e) => update(m.id, { tara: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className={styles.field}>
                <Label>Peso neto (kg)</Label>
                <div className={styles.computed}>{fmt(neto(m))}</div>
              </div>
              <div className={styles.field}>
                <Label>Precio por kilo</Label>
                <Input
                  type="number"
                  step="0.01"
                  className={styles.mono}
                  value={m.precioKilo}
                  onChange={(e) => update(m.id, { precioKilo: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className={styles.field}>
                <Label>Total</Label>
                <div className={styles.computed}>$ {fmt(total(m))}</div>
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <Label>Observaciones del material</Label>
                <Textarea
                  rows={2}
                  value={m.observaciones}
                  onChange={(e) => update(m.id, { observaciones: e.target.value })}
                  placeholder="Estado, humedad, contaminación, etc."
                />
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addMaterial}>
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
        {error && (
          <span role="alert" style={{ color: "#c0392b", fontSize: 13 }}>
            {error}
          </span>
        )}
        {exito && (
          <span role="status" style={{ color: "#178E3B", fontSize: 13 }}>
            Ingreso registrado, abriendo el historial...
          </span>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Registrando..." : "Registrar ingreso"}
        </Button>
      </div>
    </form>
  );
}
