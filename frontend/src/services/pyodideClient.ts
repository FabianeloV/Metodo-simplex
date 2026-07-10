import pyBackendSources from "virtual:py-backend";

/**
 * Cliente que ejecuta los motores de optimización del backend DENTRO del
 * navegador mediante Pyodide (Python compilado a WebAssembly). Sustituye la
 * antigua capa HTTP: ya no hay un servidor FastAPI en Railway, sino el mismo
 * código Python corriendo del lado del cliente y servido como estáticos desde
 * GitHub Pages.
 *
 * Cada `xxxApi.solve(payload)` delega en `solve(method, payload)`, que:
 *   1. carga Pyodide (una sola vez) desde la CDN de jsDelivr,
 *   2. carga numpy + sympy,
 *   3. escribe el paquete `app` (motores + bridge) en el FS virtual,
 *   4. invoca `app.bridge.dispatch(method, json)` y devuelve la respuesta.
 */

// Versión de Pyodide fijada. Su distribución incluye sympy 1.13.3 (idéntico a
// backend/requirements.txt) y numpy 2.0.2, garantizando resultados y cadenas
// simbólicas equivalentes a los del backend original.
const PYODIDE_VERSION = "0.27.2";
const PYODIDE_INDEX_URL =
  import.meta.env.VITE_PYODIDE_INDEX_URL ??
  `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Paquetes que los motores necesitan (ambos incluidos en la distribución de Pyodide).
const REQUIRED_PACKAGES = ["numpy", "sympy"];

/** Error equivalente al que lanzaba la capa HTTP (status + mensaje del backend). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type DispatchFn = (method: string, payloadJson: string) => string;

interface PyodideInterface {
  loadPackage: (packages: string[]) => Promise<void>;
  runPython: (code: string) => unknown;
  FS: {
    mkdirTree: (path: string) => void;
    writeFile: (path: string, data: string) => void;
  };
  globals: { get: (name: string) => unknown };
}

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

type SolveEnvelope<TResponse> =
  | { ok: true; data: TResponse }
  | { ok: false; status: number; detail: string };

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-pyodide]")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.pyodide = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`No se pudo cargar Pyodide desde ${src}`));
    document.head.appendChild(script);
  });
}

let bootstrapPromise: Promise<DispatchFn> | null = null;

async function bootstrap(): Promise<DispatchFn> {
  await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
  if (!window.loadPyodide) {
    throw new Error("Pyodide no se inicializó correctamente");
  }

  const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  await pyodide.loadPackage(REQUIRED_PACKAGES);

  // Copia el paquete Python del backend al sistema de archivos virtual.
  for (const [path, source] of Object.entries(pyBackendSources)) {
    const fullPath = `/pybackend/${path}`;
    const dir = fullPath.slice(0, fullPath.lastIndexOf("/"));
    pyodide.FS.mkdirTree(dir);
    pyodide.FS.writeFile(fullPath, source);
  }

  pyodide.runPython(`
import sys
if "/pybackend" not in sys.path:
    sys.path.insert(0, "/pybackend")
from app.bridge import dispatch as _dispatch
`);

  return pyodide.globals.get("_dispatch") as DispatchFn;
}

/**
 * Inicia (o reutiliza) la carga de Pyodide. Se puede llamar de forma anticipada
 * para "precalentar" el runtime antes del primer cálculo.
 */
export function warmup(): Promise<DispatchFn> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      // Permite reintentar tras un fallo transitorio (p. ej. red).
      bootstrapPromise = null;
      throw err;
    });
  }
  return bootstrapPromise;
}

/**
 * Ejecuta un método de optimización en el navegador y devuelve la respuesta ya
 * tipada. Misma forma de datos y mismo manejo de errores (`ApiError` con el
 * mensaje del backend) que la implementación HTTP anterior.
 */
export async function solve<TResponse>(
  method: string,
  payload: unknown,
): Promise<TResponse> {
  const dispatch = await warmup();
  const envelopeJson = dispatch(method, JSON.stringify(payload));
  const envelope = JSON.parse(envelopeJson) as SolveEnvelope<TResponse>;

  if (!envelope.ok) {
    throw new ApiError(envelope.status, envelope.detail);
  }
  return envelope.data;
}
