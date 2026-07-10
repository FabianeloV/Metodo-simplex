/// <reference types="vite/client" />

declare module "virtual:py-backend" {
  /**
   * Rutas POSIX ("app/core/xxx.py") → código fuente Python del backend,
   * inyectado en tiempo de build por el plugin `py-backend-sources` de Vite.
   */
  const sources: Record<string, string>;
  export default sources;
}

interface ImportMetaEnv {
  /** Sobrescribe el origen desde el que se carga el runtime de Pyodide. */
  readonly VITE_PYODIDE_INDEX_URL?: string;
}
