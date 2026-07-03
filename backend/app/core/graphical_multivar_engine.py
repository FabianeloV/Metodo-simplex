"""Método gráfico para optimización no restringida de 2-3 variables.

En vez de graficar directamente (imposible para 3 variables, ya que la
gráfica de f(x,y,z) vive en 4 dimensiones), se buscan los puntos críticos
de f resolviendo ∇f(x) = 0 con el método de Newton multivariable, arrancando
desde una grilla de puntos dentro de los límites dados por el usuario:

    x^(k+1) = x^k - H(x^k)⁻¹ · ∇f(x^k)

No se usa `sympy.solve` porque puede colgarse o devolver conjuntos
paramétricos en expresiones no polinómicas, y no hay una forma limpia de
acotar su tiempo. Tampoco se usa `scipy` (no está entre las dependencias del
proyecto): Newton con Hessiano simbólico alcanza para las expresiones que
soporta esta aplicación (2-3 variables).

Cada punto crítico se clasifica según el signo de los autovalores del
Hessiano evaluado ahí (todos positivos → mínimo, todos negativos → máximo,
signos mixtos → silla, autovalor casi nulo → degenerado).

Además se arma la grilla/volumen para graficar:
  - 2 variables: malla NxN de z = f(x,y) (para superficie y curvas de nivel).
  - 3 variables: nube de puntos NxNxN con el valor de f (para isosuperficie).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import product

import numpy as np
from sympy import symbols, sympify, diff, hessian, lambdify

SURFACE_RESOLUTION = 60
VOLUME_RESOLUTION = 25
NEWTON_MAX_ITER = 50
NEWTON_TOL = 1e-8
SEEDS_PER_AXIS_2D = 6
SEEDS_PER_AXIS_3D = 4
DEGENERATE_EIGENVALUE_TOL = 1e-6
DEDUPE_DECIMALS = 5


@dataclass
class CriticalPoint:
    point: list[float]
    value: float
    nature: str


@dataclass
class GraphicalMultivarResult:
    status: str
    variables: list[str]
    function_str: str
    optimal_point: list[float] | None
    optimal_value: float | None
    critical_points: list[CriticalPoint]
    surface: dict | None
    volume: dict | None
    message: str


def _to_none_if_not_finite(value: float) -> float | None:
    return value if np.isfinite(value) else None


class GraphicalMultivarEngine:
    """Encuentra y clasifica los puntos críticos de f(x₁,…,xₙ), n ∈ {2,3}."""

    def __init__(
        self,
        expression: str,
        variables: list[str],
        bounds: list[list[float]],
        goal: str,
    ) -> None:
        if not (2 <= len(variables) <= 3):
            raise ValueError("Se soportan 2 o 3 variables.")
        if len(bounds) != len(variables):
            raise ValueError("bounds debe tener el mismo número de elementos que variables.")
        for lo, hi in bounds:
            if hi <= lo:
                raise ValueError("Cada rango debe cumplir max > min.")

        self.var_names = variables
        self.n = len(variables)
        self.bounds = [(float(lo), float(hi)) for lo, hi in bounds]
        self.goal = goal

        self.syms = symbols(variables)
        if not isinstance(self.syms, (tuple, list)):
            self.syms = (self.syms,)

        try:
            self.expr = sympify(expression)
        except Exception as exc:
            raise ValueError(f"Expresión inválida: {exc}") from exc

        self.grad_exprs = [diff(self.expr, v) for v in self.syms]
        self.hess_expr = hessian(self.expr, self.syms)

        self.f = lambdify(self.syms, self.expr, "numpy")
        self.grad_f = lambdify(self.syms, self.grad_exprs, "numpy")
        self.hess_f = lambdify(self.syms, self.hess_expr, "numpy")

        self.function_str = str(self.expr)

    def _eval_f(self, x: np.ndarray) -> float:
        return float(self.f(*x))

    def _eval_grad(self, x: np.ndarray) -> np.ndarray:
        return np.asarray(self.grad_f(*x), dtype=float)

    def _eval_hessian(self, x: np.ndarray) -> np.ndarray:
        return np.asarray(self.hess_f(*x), dtype=float)

    def _newton_from(self, x0: np.ndarray) -> np.ndarray | None:
        x = np.array(x0, dtype=float)
        for _ in range(NEWTON_MAX_ITER):
            grad = self._eval_grad(x)
            if not np.all(np.isfinite(grad)):
                return None
            if np.linalg.norm(grad) < NEWTON_TOL:
                return x
            hess = self._eval_hessian(x)
            if not np.all(np.isfinite(hess)):
                return None
            try:
                delta = np.linalg.solve(hess, grad)
            except np.linalg.LinAlgError:
                return None
            if not np.all(np.isfinite(delta)):
                return None
            x = x - delta
            if not np.all(np.isfinite(x)) or np.linalg.norm(x) > 1e6:
                return None

        grad = self._eval_grad(x)
        if np.all(np.isfinite(grad)) and np.linalg.norm(grad) < NEWTON_TOL * 10:
            return x
        return None

    def _seed_points(self) -> list[np.ndarray]:
        seeds_per_axis = SEEDS_PER_AXIS_2D if self.n == 2 else SEEDS_PER_AXIS_3D
        axes = [
            np.linspace(lo, hi, seeds_per_axis + 2)[1:-1]
            for lo, hi in self.bounds
        ]
        return [np.array(combo, dtype=float) for combo in product(*axes)]

    def _in_bounds(self, x: np.ndarray, eps: float = 1e-4) -> bool:
        return all(
            self.bounds[i][0] - eps <= x[i] <= self.bounds[i][1] + eps
            for i in range(self.n)
        )

    def _find_critical_points(self) -> list[CriticalPoint]:
        found: list[np.ndarray] = []
        for seed in self._seed_points():
            root = self._newton_from(seed)
            if root is not None and self._in_bounds(root):
                found.append(root)

        unique: list[np.ndarray] = []
        seen: set[tuple[float, ...]] = set()
        for x in found:
            key = tuple(round(v, DEDUPE_DECIMALS) for v in x)
            if key not in seen:
                seen.add(key)
                unique.append(x)

        return [self._classify(x) for x in unique]

    def _classify(self, x: np.ndarray) -> CriticalPoint:
        hess = self._eval_hessian(x)
        eigenvalues = np.linalg.eigvalsh(hess)

        if np.min(np.abs(eigenvalues)) < DEGENERATE_EIGENVALUE_TOL:
            nature = "degenerate"
        elif np.all(eigenvalues > 0):
            nature = "min"
        elif np.all(eigenvalues < 0):
            nature = "max"
        else:
            nature = "saddle"

        return CriticalPoint(point=x.tolist(), value=self._eval_f(x), nature=nature)

    def _build_surface(self) -> dict:
        (x_lo, x_hi), (y_lo, y_hi) = self.bounds[0], self.bounds[1]
        xs = np.linspace(x_lo, x_hi, SURFACE_RESOLUTION)
        ys = np.linspace(y_lo, y_hi, SURFACE_RESOLUTION)
        xx, yy = np.meshgrid(xs, ys)

        with np.errstate(all="ignore"):
            zz = np.asarray(self.f(xx, yy), dtype=float)

        z_rows = [
            [_to_none_if_not_finite(v) for v in row]
            for row in zz.tolist()
        ]
        return {"x": xs.tolist(), "y": ys.tolist(), "z": z_rows}

    def _build_volume(self) -> dict:
        (x_lo, x_hi), (y_lo, y_hi), (z_lo, z_hi) = self.bounds
        xs = np.linspace(x_lo, x_hi, VOLUME_RESOLUTION)
        ys = np.linspace(y_lo, y_hi, VOLUME_RESOLUTION)
        zs = np.linspace(z_lo, z_hi, VOLUME_RESOLUTION)
        xx, yy, zz = np.meshgrid(xs, ys, zs, indexing="ij")

        with np.errstate(all="ignore"):
            values = np.asarray(self.f(xx, yy, zz), dtype=float)

        flat_values = [_to_none_if_not_finite(v) for v in values.ravel().tolist()]
        return {
            "x": xx.ravel().tolist(),
            "y": yy.ravel().tolist(),
            "z": zz.ravel().tolist(),
            "value": flat_values,
        }

    def solve(self) -> GraphicalMultivarResult:
        critical_points = self._find_critical_points()

        matching = [cp for cp in critical_points if cp.nature == self.goal]
        candidates = matching if matching else critical_points

        best: CriticalPoint | None = None
        if candidates:
            if self.goal == "min":
                best = min(candidates, key=lambda cp: cp.value)
            else:
                best = max(candidates, key=lambda cp: cp.value)

        point_str = (
            ", ".join(f"{name} = {val:.6g}" for name, val in zip(self.var_names, best.point))
            if best
            else ""
        )

        if best and matching:
            status = "optimal"
            message = f"Se encontró un {self.goal == 'min' and 'mínimo' or 'máximo'} local en ({point_str}) con f = {best.value:.6g}."
        elif best:
            status = "no_critical_point"
            message = (
                f"No se halló ningún punto que sea {self.goal == 'min' and 'mínimo' or 'máximo'} "
                f"dentro del dominio. Se muestra el punto crítico más cercano en naturaleza: "
                f"({point_str}), de tipo '{best.nature}', con f = {best.value:.6g}."
            )
        else:
            status = "no_critical_point"
            message = "No se encontraron puntos críticos dentro del dominio especificado."

        surface = self._build_surface() if self.n == 2 else None
        volume = self._build_volume() if self.n == 3 else None

        return GraphicalMultivarResult(
            status=status,
            variables=self.var_names,
            function_str=self.function_str,
            optimal_point=best.point if best else None,
            optimal_value=best.value if best else None,
            critical_points=critical_points,
            surface=surface,
            volume=volume,
            message=message,
        )
