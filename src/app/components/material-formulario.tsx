import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
} from "../servicios/materialesApi";
import styles from "./material-formulario.module.css";

const UNIDADES_MEDIDA = ["KILOGRAMO", "TONELADA", "UNIDAD"];
const UNIDADES_EMPAQUE = ["GRANEL", "PACA"];

interface Errores {
  [campo: string]: string;
}

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

  const [nombre, setNombre] = useState(material?.nombre ?? "");
  const [categoriaCodigo, setCategoriaCodigo] = useState(material?.categoriaCodigo ?? "");
  const [subcategoriaCodigo, setSubcategoriaCodigo] = useState(material?.subcategoriaCodigo ?? "");
  const [resinaCodigo, setResinaCodigo] = useState(material?.resinaCodigo ?? "");
  const [colorCodigo, setColorCodigo] = useState(material?.colorCodigo ?? "");
  const [unidadMedida, setUnidadMedida] = useState(material?.unidadMedida ?? "");
  const [unidadEmpaque, setUnidadEmpaque] = useState(material?.unidadEmpaque ?? "");
  const [precioBase, setPrecioBase] = useState(material ? String(material.precioBase) : "");
  const [factorCalidad, setFactorCalidad] = useState(material ? String(material.factorCalidad) : "1.00");
  const [umbralMerma, setUmbralMerma] = useState(
    material?.umbralMerma != null ? String(material.umbralMerma) : "",
  );

  const [categorias, setCategorias] = useState<OpcionCatalogo[]>([]);
  const [subcategorias, setSubcategorias] = useState<OpcionCatalogo[]>([]);
  const [resinas, setResinas] = useState<OpcionCatalogo[]>([]);
  const [colores, setColores] = useState<OpcionCatalogo[]>([]);

  const [errores, setErrores] = useState<Errores>({});
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
      setResinaCodigo("");
      setColorCodigo("");
    }
  }, [esPlastico]);

  function manejarCambioCategoria(valor: string) {
    setCategoriaCodigo(valor);
    setSubcategoriaCodigo(""); // se reinicia al cambiar categoría
  }

  function validar(): boolean {
    const nuevos: Errores = {};
    if (nombre.trim().length < 3) nuevos.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!categoriaCodigo) nuevos.categoriaCodigo = "Selecciona una categoría.";
    if (!unidadMedida) nuevos.unidadMedida = "Selecciona la unidad de medida.";
    if (!unidadEmpaque) nuevos.unidadEmpaque = "Selecciona la unidad de empaque.";

    const precio = parseFloat(precioBase);
    if (precioBase === "" || Number.isNaN(precio) || precio < 0) {
      nuevos.precioBase = "El precio base debe ser mayor o igual a 0.";
    }
    const factor = parseFloat(factorCalidad);
    if (factorCalidad === "" || Number.isNaN(factor) || factor <= 0) {
      nuevos.factorCalidad = "El factor de calidad debe ser mayor que 0.";
    }
    if (umbralMerma !== "") {
      const merma = parseFloat(umbralMerma);
      if (Number.isNaN(merma) || merma < 0 || merma > 100) {
        nuevos.umbralMerma = "El umbral de merma debe estar entre 0 y 100.";
      }
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    if (!validar()) return;

    // Regla de negocio: resina y color solo se envían si la categoría es PLASTICO.
    const cuerpo: CuerpoMaterial = {
      nombre: nombre.trim(),
      categoriaCodigo,
      subcategoriaCodigo: subcategoriaCodigo || null,
      codigoResinaCodigo: esPlastico ? resinaCodigo || null : null,
      colorCodigo: esPlastico ? colorCodigo || null : null,
      unidadMedida,
      unidadEmpaque,
      precioBase: parseFloat(precioBase),
      factorCalidad: parseFloat(factorCalidad),
      umbralMerma: umbralMerma === "" ? null : parseFloat(umbralMerma),
    };

    setEnviando(true);
    try {
      const resultado = esEdicion
        ? await actualizarMaterial(material!.id, cuerpo)
        : await crearMaterial(cuerpo);
      alGuardar(resultado);
    } catch (error: any) {
      const estado = error?.response?.status;
      if (estado === 400) setErrorGeneral("Revisa los datos del formulario.");
      else if (estado === 403) setErrorGeneral("No tienes permisos para esta acción.");
      else if (estado === 404) setErrorGeneral("El material no existe o fue eliminado.");
      else setErrorGeneral("Ocurrió un error al guardar el material. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      {errorGeneral && <div className={styles.alertaError}>{errorGeneral}</div>}

      <div className={styles.campo}>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="PET Cristal"
        />
        {errores.nombre && <span className={styles.errorCampo}>{errores.nombre}</span>}
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Categoría *</Label>
          <Select value={categoriaCodigo} onValueChange={manejarCambioCategoria}>
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
          {errores.categoriaCodigo && (
            <span className={styles.errorCampo}>{errores.categoriaCodigo}</span>
          )}
        </div>
        <div className={styles.campo}>
          <Label>Subcategoría</Label>
          <Select
            value={subcategoriaCodigo}
            onValueChange={setSubcategoriaCodigo}
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
        </div>
      </div>

      <div className={styles.fila}>
        <div className={styles.campo}>
          <Label>Resina</Label>
          <Select value={resinaCodigo} onValueChange={setResinaCodigo} disabled={!esPlastico}>
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
        </div>
        <div className={styles.campo}>
          <Label>Color</Label>
          <Select value={colorCodigo} onValueChange={setColorCodigo} disabled={!esPlastico}>
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
          <Select value={unidadMedida} onValueChange={setUnidadMedida}>
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
          {errores.unidadMedida && (
            <span className={styles.errorCampo}>{errores.unidadMedida}</span>
          )}
        </div>
        <div className={styles.campo}>
          <Label>Unidad de empaque *</Label>
          <Select value={unidadEmpaque} onValueChange={setUnidadEmpaque}>
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
          {errores.unidadEmpaque && (
            <span className={styles.errorCampo}>{errores.unidadEmpaque}</span>
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
            value={precioBase}
            onChange={(e) => setPrecioBase(e.target.value)}
            placeholder="1200.00"
          />
          {errores.precioBase && <span className={styles.errorCampo}>{errores.precioBase}</span>}
        </div>
        <div className={styles.campo}>
          <Label htmlFor="factorCalidad">Factor de calidad *</Label>
          <Input
            id="factorCalidad"
            type="number"
            step="0.01"
            min="0"
            value={factorCalidad}
            onChange={(e) => setFactorCalidad(e.target.value)}
            placeholder="1.00"
          />
          {errores.factorCalidad && (
            <span className={styles.errorCampo}>{errores.factorCalidad}</span>
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
          value={umbralMerma}
          onChange={(e) => setUmbralMerma(e.target.value)}
          placeholder="5.00"
        />
        {errores.umbralMerma && <span className={styles.errorCampo}>{errores.umbralMerma}</span>}
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
