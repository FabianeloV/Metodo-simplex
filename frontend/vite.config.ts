import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve, sep } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(rootDir, "../backend");
const appDir = join(backendDir, "app");

// Módulos que dependen de FastAPI/Pydantic y NO deben ejecutarse en el navegador.
// Solo se empaqueta el paquete de cómputo puro (app/__init__.py, app/core/**,
// app/bridge.py), que corre bajo Pyodide con numpy + sympy.
const isBrowserExcluded = (relPosix: string): boolean =>
  relPosix === "app/main.py" ||
  relPosix.startsWith("app/api/") ||
  relPosix.startsWith("app/models/");

function collectPySources(): Record<string, string> {
  const sources: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (entry === "__pycache__") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(".py")) {
        const relPosix = relative(backendDir, full).split(sep).join("/");
        if (!isBrowserExcluded(relPosix)) {
          sources[relPosix] = readFileSync(full, "utf8");
        }
      }
    }
  };
  walk(appDir);
  return sources;
}

/**
 * Expone el código Python del backend como un módulo virtual
 * (`virtual:py-backend`): un objeto { "app/core/xxx.py": "<código>" } que el
 * cliente escribe en el sistema de archivos de Pyodide. Así los motores son un
 * único código fuente reutilizado tanto por el servidor FastAPI (dev local)
 * como por el despliegue estático en GitHub Pages.
 */
function pyBackendSources(): Plugin {
  const virtualId = "virtual:py-backend";
  const resolvedId = "\0" + virtualId;
  return {
    name: "py-backend-sources",
    resolveId(id) {
      if (id === virtualId) return resolvedId;
      return undefined;
    },
    load(id) {
      if (id !== resolvedId) return undefined;
      const sources = collectPySources();
      // Recarga en caliente cuando cambia cualquier .py del backend.
      for (const rel of Object.keys(sources)) {
        this.addWatchFile(join(backendDir, rel));
      }
      return `export default ${JSON.stringify(sources)};`;
    },
  };
}

export default defineConfig({
  base: "/Metodo-simplex/",
  plugins: [react(), pyBackendSources()],
  server: {
    port: 5173,
  },
});
