# Simplex Optimizer

Solver de Programación Lineal con el método Simplex.

- **Frontend**: React 18 + TypeScript + Vite  (arquitectura atómica)
- **Backend**: Python 3.11 + NumPy + SymPy  (motores de cómputo puro; API local opcional con FastAPI)

### Ejecución y despliegue

Los motores de optimización están escritos en Python, pero **no** se ejecutan en
un servidor: corren **dentro del navegador** con [Pyodide](https://pyodide.org)
(Python compilado a WebAssembly). Toda la aplicación —frontend + motores— se
publica como archivos estáticos en **GitHub Pages** mediante GitHub Actions;
**no hay servidor ni Railway**.

- El mismo código de `backend/app/core` se reutiliza tal cual: en producción lo
  carga Pyodide y, en desarrollo, puede ejecutarse además como API FastAPI local.
- El puente [`backend/app/bridge.py`](backend/app/bridge.py) expone los motores
  al navegador con el mismo contrato JSON que las rutas HTTP originales.

---

## Estructura del proyecto

```
simplex-optimizer/
├── frontend/                        # React + TypeScript
│   └── src/
│       ├── components/
│       │   ├── atoms/               # Button, Input, Select, Badge, Label, Spinner
│       │   ├── molecules/           # TabGroup, ObjectiveRow, ConstraintRow,
│       │   │                        # MetricCard, ErrorBanner, TableauTable
│       │   ├── organisms/           # AppHeader, ObjectiveForm,
│       │   │                        # ConstraintsForm, SolutionDisplay
│       │   ├── templates/           # SolverTemplate  (layout puro)
│       │   └── pages/               # SolverPage      (lógica de composición)
│       ├── hooks/                   # useConstraints, useSimplex
│       ├── services/                # *Api.ts + pyodideClient.ts (Pyodide)
│       └── types/                   # simplex.ts      (tipos compartidos)
│
└── backend/                         # Motores en Python (NumPy + SymPy)
    └── app/
        ├── bridge.py                # Puente para ejecución en el navegador (Pyodide)
        ├── api/routes/simplex.py    # Endpoint POST /api/v1/simplex/solve (API local opcional)
        ├── core/simplex_engine.py   # Algoritmo Big-M puro
        └── models/schemas.py        # Pydantic request / response
```

---

## Puesta en marcha

### 1. Backend (API FastAPI local — opcional)

> La app desplegada **no** necesita este servidor: los motores corren en el
> navegador con Pyodide. Levanta FastAPI solo si quieres probar la API HTTP o la
> documentación Swagger de forma local.

```bash
cd backend

# Entorno virtual (recomendado)
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Dependencias
pip install -r requirements.txt

# Variables de entorno (opcional)
cp .env.example .env

# Servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva disponible en:
- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc

---

### 2. Frontend

```bash
cd frontend

# Dependencias
npm install

# Variables de entorno
cp .env.example .env

# Servidor de desarrollo
npm run dev
```

Abre http://localhost:5173 en el navegador. No necesitas levantar el backend:
los motores se ejecutan en el navegador con Pyodide.

---

## Despliegue (GitHub Pages + GitHub Actions)

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) se
dispara con cada push a `master` que toque `frontend/**` o `backend/**`:

1. Instala dependencias y compila el frontend con Vite.
2. Un plugin de Vite incrusta el código Python de `backend/app/core` (+
   `bridge.py`) como estáticos, para que Pyodide los cargue en el navegador.
3. Publica `frontend/dist` en la rama `gh-pages` (GitHub Pages).

No se ejecuta Python en CI ni en ningún servidor: **no hay Railway**. El runtime
de Pyodide (numpy + sympy) se descarga desde la CDN de jsDelivr la primera vez
que el usuario resuelve un problema, y puede sobrescribirse con la variable
`VITE_PYODIDE_INDEX_URL`.

---

## Ejemplo de uso de la API

```http
POST http://localhost:8000/api/v1/simplex/solve
Content-Type: application/json

{
  "objective":    [3, 2, 5],
  "goal":         "max",
  "constraints": [
    { "coefficients": [1, 0, 1], "inequality": "<=", "rhs": 430 },
    { "coefficients": [0, 1, 1], "inequality": "<=", "rhs": 460 },
    { "coefficients": [1, 1, 0], "inequality": "<=", "rhs": 420 }
  ]
}
```

Respuesta:

```json
{
  "status":            "optimal",
  "objective_value":   1350.0,
  "variables":         { "x1": 0.0, "x2": 100.0, "x3": 230.0 },
  "iterations":        3,
  "tableau_headers":   ["Basic", "Z", "x1", "x2", "x3", "s1", "s2", "s3", "RHS"],
  "tableau_rows":      [ ... ],
  "message":           "Optimal solution found after 3 iteration(s)."
}
```

---

## Módulos de variables

| Módulo | Variables | Descripción                         |
|--------|-----------|-------------------------------------|
| 1      | 2         | Problemas 2D (visualizable en plano)|
| 2      | 3         | Estándar industrial                 |
| 3      | 4         | Optimización ampliada               |

---

## Algoritmo implementado

El motor (`simplex_engine.py`) implementa el **método Big-M**:

1. Convierte minimización → maximización (negación del objetivo).
2. Normaliza filas con RHS negativo.
3. Agrega variables de holgura (`s`), surplus (`sr`) y artificiales (`a`).
4. Aplica penalización Big-M a las artificiales en la función objetivo.
5. Itera: columna pivote (valor más negativo en fila Z) → fila pivote (razón mínima) → eliminación gaussiana.
6. Detecta soluciones no acotadas (sin fila pivote válida) e infactibles (artificiales en base con valor > 0).
7. Devuelve el tableau final y los valores de todas las variables.

---

## Scripts útiles

```bash
# Frontend – build de producción
cd frontend && npm run build

# Backend – tests (si los agregas)
cd backend && pytest

# Ver la API en formato JSON
curl http://localhost:8000/api/v1/simplex/health
```
