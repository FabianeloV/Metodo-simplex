# Simplex Optimizer

Solver de Programación Lineal con el método Simplex.

- **Frontend**: React 18 + TypeScript + Vite  (arquitectura atómica)
- **Backend**: Python 3.11 + FastAPI + NumPy

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
│       ├── services/                # simplexApi.ts   (HTTP)
│       └── types/                   # simplex.ts      (tipos compartidos)
│
└── backend/                         # FastAPI + NumPy
    └── app/
        ├── api/routes/simplex.py    # Endpoint POST /api/v1/simplex/solve
        ├── core/simplex_engine.py   # Algoritmo Big-M puro
        └── models/schemas.py        # Pydantic request / response
```

---

## Puesta en marcha

### 1. Backend

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

Abre http://localhost:5173 en el navegador.

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
