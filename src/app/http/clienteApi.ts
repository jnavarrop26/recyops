import axios, { type InternalAxiosRequestConfig } from "axios";

// Config de Axios con la marca de reintento tras renovar el token.
interface ConfigConReintento extends InternalAxiosRequestConfig {
  _reintentada?: boolean;
}

// URL base del backend (Spring Boot). Configurable vía variable de entorno.
// Define VITE_API_URL en tu entorno; por defecto apunta al proxy local "/api".
const urlBase = import.meta.env.VITE_API_URL ?? "/api";

export const clienteApi = axios.create({
  baseURL: urlBase,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adjuntar el token de autenticación si existe.
// El login queda excluido: si hubiera un token viejo o demo guardado,
// enviarlo haría que el backend rechace la petición con 401 aunque
// las credenciales escritas sean correctas.
clienteApi.interceptors.request.use((config) => {
  const esLogin = (config.url ?? "").includes("/auth/login");
  const token = localStorage.getItem("sicofar_token");
  if (token && !esLogin) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Renovación automática de sesión ─────────────────────────────────────────
// El access token de Supabase vence a la hora. Ante un 401, se renueva con el
// refresh token (una sola renovación en vuelo aunque fallen varias peticiones
// a la vez) y se reintenta la petición original. Solo si la renovación también
// falla se limpia la sesión y se vuelve al login.

let renovacionEnCurso: Promise<string | null> | null = null;

async function renovarSesion(): Promise<string | null> {
  const refresh = localStorage.getItem("sicofar_refresh");
  if (!refresh) return null;
  try {
    // axios "crudo" (sin interceptores) para no entrar en bucle
    const { data } = await axios.post<{ token: string; refreshToken?: string; rol?: string }>(
      `${urlBase}/auth/refresh`,
      { refreshToken: refresh },
    );
    localStorage.setItem("sicofar_token", data.token);
    if (data.refreshToken) localStorage.setItem("sicofar_refresh", data.refreshToken);
    if (data.rol) localStorage.setItem("sicofar_rol", data.rol);
    return data.token;
  } catch {
    return null;
  }
}

function limpiarSesionYSalir() {
  localStorage.removeItem("sicofar_token");
  localStorage.removeItem("sicofar_rol");
  localStorage.removeItem("sicofar_nombre");
  localStorage.removeItem("sicofar_username");
  localStorage.removeItem("sicofar_refresh");
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

clienteApi.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }
    const estado = error.response?.status;
    const config = error.config as ConfigConReintento;
    const url = config.url ?? "";

    if (estado !== 401 || url.includes("/auth/")) {
      return Promise.reject(error);
    }

    // Un solo reintento por petición
    if (!config._reintentada) {
      config._reintentada = true;
      renovacionEnCurso = renovacionEnCurso ?? renovarSesion().finally(() => {
        renovacionEnCurso = null;
      });
      const nuevoToken = await renovacionEnCurso;
      if (nuevoToken) {
        config.headers.Authorization = `Bearer ${nuevoToken}`;
        return clienteApi(config);
      }
    }

    limpiarSesionYSalir();
    return Promise.reject(error);
  },
);
