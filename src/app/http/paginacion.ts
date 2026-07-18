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
