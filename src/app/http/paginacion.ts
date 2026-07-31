// Página estándar de Spring Data. Todos los listados paginados del backend
// comparten esta forma; los módulos declaran alias como `PaginaBodegas = Pagina<Bodega>`.
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// El backend a veces responde un arreglo plano y a veces una página de Spring
// ({ content: [...] }). Esta función unifica ambas formas en una Pagina<T>.
export function normalizarPagina<T>(data: unknown, size: number): Pagina<T> {
  if (Array.isArray(data)) {
    return {
      content: data as T[],
      totalElements: data.length,
      totalPages: 1,
      number: 0,
      size: data.length,
    };
  }
  const pagina = data as Partial<Pagina<T>> | null | undefined;
  return {
    content: Array.isArray(pagina?.content) ? pagina.content : [],
    totalElements: pagina?.totalElements ?? 0,
    totalPages: pagina?.totalPages ?? 0,
    number: pagina?.number ?? 0,
    size: pagina?.size ?? size,
  };
}

// Tope de tamaño de página que exige el backend (@Max(100) en los controladores paginados).
const TAMANO_MAXIMO_PAGINA = 100;

// Trae el contenido completo de un listado paginado, iterando página por página.
// Útil para selects de filtro y exportes (reportes) que antes pedían un `size` único
// muy grande (200-500) explotando que el backend no tenía tope: ahora rechaza con 400
// cualquier `size` por encima de 100, así que "traer todo" exige paginar internamente.
export async function obtenerTodo<T>(
  pedirPagina: (page: number, size: number) => Promise<Pagina<T>>,
  size = TAMANO_MAXIMO_PAGINA,
): Promise<T[]> {
  const todo: T[] = [];
  let page = 0;
  let totalPages = 1;
  do {
    const pagina = await pedirPagina(page, size);
    todo.push(...pagina.content);
    totalPages = pagina.totalPages;
    page += 1;
  } while (page < totalPages);
  return todo;
}
