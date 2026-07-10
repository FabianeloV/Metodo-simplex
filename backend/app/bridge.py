"""Puente de despacho para ejecutar los motores de optimización en el navegador.

Este módulo es el punto de entrada que usa el frontend cuando los motores se
ejecutan del lado del cliente con Pyodide (WebAssembly). Evita FastAPI/Pydantic
y llama directamente a los motores de cómputo puro de ``app.core``, devolviendo
una cadena JSON para que el lado JavaScript solo tenga que hacer ``JSON.parse``.

Reproduce exactamente el contrato JSON de las rutas de ``app/api/routes`` (los
mismos nombres de campo que los modelos de respuesta de ``app/models/schemas``),
de modo que el frontend no distingue si el cálculo ocurrió en un servidor
FastAPI o dentro del navegador.

Depende únicamente de numpy + sympy (ambos incluidos en Pyodide) y de los
motores de ``app.core``; no importa la pila de FastAPI, por lo que puede
importarse dentro del navegador.
"""
from __future__ import annotations

import json
import math
from dataclasses import fields, is_dataclass
from typing import Any, Callable

import numpy as np

from app.core.simplex_engine import SimplexEngine
from app.core.graphical_method import build_graphical_data
from app.core.binary_engine import BinaryEngine
from app.core.integer_engine import IntegerEngine
from app.core.bisection_engine import BisectionEngine
from app.core.newton_engine import NewtonEngine
from app.core.gradient_engine import GradientEngine
from app.core.graphical_multivar_engine import GraphicalMultivarEngine
from app.core.kkt_engine import KKTEngine


# ─── Serialización a tipos JSON nativos ──────────────────────────────────────

def _plain(obj: Any) -> Any:
    """Convierte recursivamente la salida de un motor en valores JSON seguros.

    - Escalares/arreglos de numpy → tipos nativos de Python.
    - dataclasses → dict con los mismos nombres de campo que los esquemas.
    - floats no finitos (NaN/Inf) → None (para producir JSON válido).
    """
    if isinstance(obj, np.generic):
        obj = obj.item()
    if isinstance(obj, np.ndarray):
        return [_plain(v) for v in obj.tolist()]
    if obj is None or isinstance(obj, (str, bool, int)):
        return obj
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if is_dataclass(obj) and not isinstance(obj, type):
        return {f.name: _plain(getattr(obj, f.name)) for f in fields(obj)}
    if isinstance(obj, dict):
        return {k: _plain(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_plain(v) for v in obj]
    return obj


# ─── Manejadores por método (espejo de app/api/routes) ───────────────────────

def _normalize_graphical(g: dict | None) -> dict | None:
    """Rellena los campos opcionales de ``GraphLine`` (label, inequality).

    La ruta FastAPI serializa los datos gráficos con el modelo Pydantic
    ``GraphLine``, que añade ``label``/``inequality`` con valor por defecto
    ``None`` cuando faltan (p. ej. la ``objective_line`` no trae ``inequality``).
    Replicamos ese relleno para que el JSON sea idéntico al del backend HTTP.
    """
    if g is None:
        return None
    for line in g.get("constraints", []) or []:
        line.setdefault("label", None)
        line.setdefault("inequality", None)
    objective_line = g.get("objective_line")
    if objective_line is not None:
        objective_line.setdefault("label", None)
        objective_line.setdefault("inequality", None)
    return g


def _simplex(payload: dict) -> dict:
    objective = payload["objective"]
    goal = payload["goal"]
    constraints = payload["constraints"]
    coeffs = [c["coefficients"] for c in constraints]
    inequalities = [c["inequality"] for c in constraints]
    rhs_values = [c["rhs"] for c in constraints]

    engine = SimplexEngine(
        objective=objective,
        goal=goal,
        constraint_coeffs=coeffs,
        inequalities=inequalities,
        rhs_values=rhs_values,
    )
    result = engine.solve()

    graphical = None
    if len(objective) == 2:
        optimal_point = None
        if result.status == "optimal" and result.variables is not None:
            optimal_point = {
                "x": result.variables.get("x1", 0.0),
                "y": result.variables.get("x2", 0.0),
            }
        graphical = _normalize_graphical(build_graphical_data(
            objective=objective,
            goal=goal,
            constraint_coeffs=coeffs,
            inequalities=inequalities,
            rhs_values=rhs_values,
            status=result.status,
            optimal_point=optimal_point,
            objective_value=result.objective_value,
        ))

    if result.status == "optimal":
        return {
            "status": "optimal",
            "objective_value": result.objective_value,
            "variables": result.variables,
            "iterations": result.iterations,
            "tableau_headers": result.tableau_headers,
            "tableau_rows": result.tableau_rows,
            "message": result.message,
            "graphical": graphical,
            "iteration_tableaux": result.iteration_tableaux,
        }

    # No óptimo (unbounded / infeasible): mismos campos que SimplexResponse,
    # con None donde la ruta no los rellena.
    return {
        "status": result.status,
        "objective_value": None,
        "variables": None,
        "iterations": None,
        "tableau_headers": None,
        "tableau_rows": None,
        "message": result.message,
        "graphical": graphical,
        "iteration_tableaux": None,
    }


def _binary(payload: dict) -> Any:
    constraints = payload["constraints"]
    engine = BinaryEngine(
        objective=payload["objective"],
        goal=payload["goal"],
        constraint_coeffs=[c["coefficients"] for c in constraints],
        inequalities=[c["inequality"] for c in constraints],
        rhs_values=[c["rhs"] for c in constraints],
    )
    return engine.solve()


def _integer(payload: dict) -> Any:
    constraints = payload["constraints"]
    engine = IntegerEngine(
        objective=payload["objective"],
        goal=payload["goal"],
        constraint_coeffs=[c["coefficients"] for c in constraints],
        inequalities=[c["inequality"] for c in constraints],
        rhs_values=[c["rhs"] for c in constraints],
    )
    return engine.solve()


def _bisection(payload: dict) -> Any:
    engine = BisectionEngine(
        coefficients=payload["coefficients"],
        goal=payload["goal"],
        a=payload["a"],
        b=payload["b"],
        tolerance=payload.get("tolerance", 1e-6),
        max_iterations=payload.get("max_iterations", 100),
    )
    return engine.solve()


def _newton(payload: dict) -> Any:
    engine = NewtonEngine(
        coefficients=payload["coefficients"],
        goal=payload["goal"],
        x0=payload["x0"],
        tolerance=payload.get("tolerance", 1e-6),
        max_iterations=payload.get("max_iterations", 100),
    )
    return engine.solve()


def _gradient(payload: dict) -> Any:
    engine = GradientEngine(
        expression=payload["expression"],
        variables=payload["variables"],
        x0=payload["x0"],
        goal=payload["goal"],
        step_size=payload.get("step_size", 0.1),
        tolerance=payload.get("tolerance", 1e-6),
        max_iterations=payload.get("max_iterations", 100),
    )
    return engine.solve()


def _graphical(payload: dict) -> Any:
    engine = GraphicalMultivarEngine(
        expression=payload["expression"],
        variables=payload["variables"],
        bounds=payload["bounds"],
        goal=payload["goal"],
    )
    return engine.solve()


def _kkt(payload: dict) -> Any:
    engine = KKTEngine(
        expression=payload["expression"],
        variables=payload["variables"],
        goal=payload["goal"],
        constraints=payload["constraints"],
    )
    return engine.solve()


_HANDLERS: dict[str, Callable[[dict], Any]] = {
    "simplex": _simplex,
    "binary": _binary,
    "integer": _integer,
    "bisection": _bisection,
    "newton": _newton,
    "gradient": _gradient,
    "graphical": _graphical,
    "kkt": _kkt,
}


# ─── Punto de entrada llamado desde JavaScript ───────────────────────────────

def dispatch(method: str, payload_json: str) -> str:
    """Resuelve ``method`` con el payload dado y devuelve un sobre JSON.

    Éxito  → ``{"ok": true,  "data": <respuesta>}``
    Error  → ``{"ok": false, "status": <int>, "detail": <str>}``

    El sobre de error reproduce el comportamiento previo del backend HTTP, en el
    que las rutas devolvían ``HTTPException(status_code=422, detail=str(exc))``;
    el cliente del frontend lo vuelve a lanzar como ``ApiError(status, detail)``.
    """
    try:
        payload = json.loads(payload_json)
    except Exception as exc:  # payload mal formado
        return json.dumps({"ok": False, "status": 400, "detail": f"Payload inválido: {exc}"})

    handler = _HANDLERS.get(method)
    if handler is None:
        return json.dumps({"ok": False, "status": 404, "detail": f"Método desconocido: {method}"})

    try:
        data = handler(payload)
        return json.dumps({"ok": True, "data": _plain(data)}, allow_nan=False)
    except Exception as exc:
        return json.dumps({"ok": False, "status": 422, "detail": str(exc)})
