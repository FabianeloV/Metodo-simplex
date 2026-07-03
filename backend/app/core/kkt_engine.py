"""Condiciones de Karush-Kuhn-Tucker (KKT) para optimización no lineal con
restricciones, resuelto por enumeración de conjuntos activos.

Para cada subconjunto S de las restricciones de desigualdad (tratadas como
activas, g_i(x) = 0), se arma el sistema apilado

    ∇f(x) + Σ_{i∈S} λ_i·∇g_i(x) + Σ_j μ_j·∇h_j(x) = 0
    g_i(x) = 0   (i ∈ S)
    h_j(x) = 0   (∀ j, restricciones de igualdad, siempre activas)

y se resuelve numéricamente con Newton multivariable (mismo enfoque que
``graphical_multivar_engine.py``: nada de ``sympy.solve`` —puede colgarse o
devolver soluciones paramétricas en sistemas no polinómicos— ni ``scipy``
—no está entre las dependencias del proyecto—). El Hessiano de la
Lagrangiana y los gradientes de cada restricción se calculan una sola vez
por expresión (no por cada uno de los hasta 2^m subconjuntos) y se
combinan con álgebra de numpy en tiempo de resolución.

Para maximización se resuelve internamente min(-f) sujeto a las mismas
restricciones: la estacionariedad de min(-f) da ∇f = Σλ_i∇g_i, idéntica a
la que exige la convención estándar de KKT para maximizar (L = f - Σλ_i g_i,
∇f - Σλ_i∇g_i = 0), así que los λ obtenidos son directamente los correctos
y la prueba λ ≥ 0 no necesita ajuste de signo.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from itertools import combinations

import numpy as np
from sympy import symbols, sympify, diff, hessian, lambdify

SEED_RANGE = (-10.0, 10.0)
SEEDS_PER_AXIS = 3
MULTIPLIER_SEEDS = [1.0, -1.0, 5.0]
NEWTON_MAX_ITER = 30
NEWTON_TOL = 1e-8
FEASIBILITY_TOL = 1e-6
MAX_CONSTRAINTS = 5


@dataclass
class KKTCaseResult:
    case_id: int
    active_indices: list[int]
    status: str
    point: list[float] | None
    lambdas: dict[str, float] | None
    mus: dict[str, float] | None
    objective_value: float | None
    note: str


@dataclass
class KKTSolveResult:
    status: str
    variables: list[str]
    function_str: str
    goal: str
    constraints_str: list[str]
    optimal_point: list[float] | None
    optimal_value: float | None
    optimal_case_id: int | None
    cases: list[KKTCaseResult] = field(default_factory=list)
    cases_explored: int = 0
    message: str = ""


class KKTEngine:
    def __init__(
        self,
        expression: str,
        variables: list[str],
        goal: str,
        constraints: list[dict],
    ) -> None:
        if not (2 <= len(variables) <= 3):
            raise ValueError("Se soportan 2 o 3 variables.")
        if not (1 <= len(constraints) <= MAX_CONSTRAINTS):
            raise ValueError(f"Se admiten entre 1 y {MAX_CONSTRAINTS} restricciones.")

        self.var_names = variables
        self.n = len(variables)
        self.goal = goal

        self.syms = symbols(variables)
        if not isinstance(self.syms, (tuple, list)):
            self.syms = (self.syms,)

        try:
            self.f_orig_expr = sympify(expression)
        except Exception as exc:
            raise ValueError(f"Expresión inválida: {exc}") from exc
        self.f_expr = -self.f_orig_expr if goal == "max" else self.f_orig_expr

        self.ineq_exprs: list = []
        self.eq_exprs: list = []
        self.constraints_str: list[str] = []

        for c in constraints:
            expr_str = c["expression"]
            try:
                e = sympify(expr_str)
            except Exception as exc:
                raise ValueError(f"Restricción inválida '{expr_str}': {exc}") from exc

            rhs = float(c["rhs"])
            ineq = c["inequality"]
            if ineq == "<=":
                self.ineq_exprs.append(e - rhs)
                self.constraints_str.append(f"{expr_str} ≤ {rhs:g}")
            elif ineq == ">=":
                self.ineq_exprs.append(rhs - e)
                self.constraints_str.append(f"{expr_str} ≥ {rhs:g}")
            else:
                self.eq_exprs.append(e - rhs)
                self.constraints_str.append(f"{expr_str} = {rhs:g}")

        self.m = len(self.ineq_exprs)
        self.p = len(self.eq_exprs)

        self.f_orig_func = lambdify(self.syms, self.f_orig_expr, "numpy")
        self.grad_f = lambdify(self.syms, [diff(self.f_expr, v) for v in self.syms], "numpy")
        self.hess_f = lambdify(self.syms, hessian(self.f_expr, self.syms), "numpy")

        self.g_funcs = [lambdify(self.syms, g, "numpy") for g in self.ineq_exprs]
        self.grad_g = [lambdify(self.syms, [diff(g, v) for v in self.syms], "numpy") for g in self.ineq_exprs]
        self.hess_g = [lambdify(self.syms, hessian(g, self.syms), "numpy") for g in self.ineq_exprs]

        self.h_funcs = [lambdify(self.syms, h, "numpy") for h in self.eq_exprs]
        self.grad_h = [lambdify(self.syms, [diff(h, v) for v in self.syms], "numpy") for h in self.eq_exprs]
        self.hess_h = [lambdify(self.syms, hessian(h, self.syms), "numpy") for h in self.eq_exprs]

        self.function_str = str(self.f_orig_expr)

    def _vec(self, func, x) -> np.ndarray:
        return np.asarray(func(*x), dtype=float)

    def _mat(self, func, x) -> np.ndarray:
        return np.asarray(func(*x), dtype=float)

    def _scalar(self, func, x) -> float:
        return float(func(*x))

    def _stacked_system(self, x, lambdas, mus, active_idx):
        n, s, p = self.n, len(active_idx), self.p

        grad = self._vec(self.grad_f, x)
        hess = self._mat(self.hess_f, x)

        grad_g_active = [self._vec(self.grad_g[i], x) for i in active_idx]
        for k, i in enumerate(active_idx):
            grad = grad + lambdas[k] * grad_g_active[k]
            hess = hess + lambdas[k] * self._mat(self.hess_g[i], x)

        grad_h_all = [self._vec(self.grad_h[j], x) for j in range(p)]
        for j in range(p):
            grad = grad + mus[j] * grad_h_all[j]
            hess = hess + mus[j] * self._mat(self.hess_h[j], x)

        rows_g = np.array([self._scalar(self.g_funcs[i], x) for i in active_idx], dtype=float)
        rows_h = np.array([self._scalar(self.h_funcs[j], x) for j in range(p)], dtype=float)
        F = np.concatenate([grad, rows_g, rows_h])

        top_mid = np.column_stack(grad_g_active) if s > 0 else np.zeros((n, 0))
        top_right = np.column_stack(grad_h_all) if p > 0 else np.zeros((n, 0))
        top = np.hstack([hess, top_mid, top_right])
        mid = np.hstack([top_mid.T, np.zeros((s, s)), np.zeros((s, p))])
        bot = np.hstack([top_right.T, np.zeros((p, s)), np.zeros((p, p))])
        J = np.vstack([top, mid, bot])

        return F, J

    def _newton(self, x0, lambda0, mu0, active_idx):
        x = np.array(x0, dtype=float)
        lambdas = np.array(lambda0, dtype=float)
        mus = np.array(mu0, dtype=float)
        n, s = self.n, len(active_idx)

        for _ in range(NEWTON_MAX_ITER):
            F, J = self._stacked_system(x, lambdas, mus, active_idx)
            if not np.all(np.isfinite(F)):
                return None
            if np.linalg.norm(F) < NEWTON_TOL:
                return x, lambdas, mus
            if not np.all(np.isfinite(J)):
                return None
            try:
                delta = np.linalg.solve(J, F)
            except np.linalg.LinAlgError:
                return None
            if not np.all(np.isfinite(delta)):
                return None

            u = np.concatenate([x, lambdas, mus]) - delta
            if not np.all(np.isfinite(u)) or np.linalg.norm(u) > 1e6:
                return None
            x, lambdas, mus = u[:n], u[n:n + s], u[n + s:]

        F, _ = self._stacked_system(x, lambdas, mus, active_idx)
        if np.all(np.isfinite(F)) and np.linalg.norm(F) < NEWTON_TOL * 10:
            return x, lambdas, mus
        return None

    def _seed_points(self) -> list[np.ndarray]:
        axes = [np.linspace(*SEED_RANGE, SEEDS_PER_AXIS) for _ in range(self.n)]
        grids = np.meshgrid(*axes, indexing="ij")
        return [pt for pt in np.stack([g.ravel() for g in grids], axis=-1)]

    def _solve_case(self, case_id: int, active_idx: tuple[int, ...]) -> KKTCaseResult:
        s = len(active_idx)
        for x0 in self._seed_points():
            for mult in MULTIPLIER_SEEDS:
                result = self._newton(x0, [mult] * s, [mult] * self.p, active_idx)
                if result is not None:
                    x, lambdas, mus = result
                    return self._classify(case_id, active_idx, x, lambdas, mus)

        return KKTCaseResult(
            case_id=case_id,
            active_indices=list(active_idx),
            status="no_convergence",
            point=None, lambdas=None, mus=None, objective_value=None,
            note="No se encontró un punto estacionario para este conjunto de restricciones activas.",
        )

    def _classify(self, case_id, active_idx, x, lambdas, mus) -> KKTCaseResult:
        lambdas_dict = {f"λ{i + 1}": float(lambdas[k]) for k, i in enumerate(active_idx)}
        mus_dict = {f"μ{j + 1}": float(mus[j]) for j in range(self.p)}
        point = [float(v) for v in x]
        value = self._scalar(self.f_orig_func, x)

        for k, i in enumerate(active_idx):
            if lambdas[k] < -FEASIBILITY_TOL:
                return KKTCaseResult(
                    case_id=case_id, active_indices=list(active_idx), status="dual_infeasible",
                    point=point, lambdas=lambdas_dict, mus=mus_dict, objective_value=value,
                    note=f"Descartado: λ{i + 1} = {lambdas[k]:.4g} < 0 (debe ser ≥ 0).",
                )

        for i in range(self.m):
            if i in active_idx:
                continue
            gval = self._scalar(self.g_funcs[i], x)
            if gval > FEASIBILITY_TOL:
                return KKTCaseResult(
                    case_id=case_id, active_indices=list(active_idx), status="primal_infeasible",
                    point=point, lambdas=lambdas_dict, mus=mus_dict, objective_value=value,
                    note=f"Descartado: la restricción g{i + 1}(x) = {gval:.4g} > 0 no es factible en este punto.",
                )

        active_str = ", ".join(f"g{i + 1}" for i in active_idx) if active_idx else "ninguna"
        return KKTCaseResult(
            case_id=case_id, active_indices=list(active_idx), status="valid",
            point=point, lambdas=lambdas_dict, mus=mus_dict, objective_value=value,
            note=f"Caso válido (restricciones activas: {active_str}).",
        )

    def solve(self) -> KKTSolveResult:
        cases: list[KKTCaseResult] = []
        case_id = 0
        for r in range(self.m + 1):
            for active_idx in combinations(range(self.m), r):
                cases.append(self._solve_case(case_id, active_idx))
                case_id += 1

        valid = [c for c in cases if c.status == "valid"]
        best: KKTCaseResult | None = None
        if valid:
            best = (
                min(valid, key=lambda c: c.objective_value)
                if self.goal == "min"
                else max(valid, key=lambda c: c.objective_value)
            )

        if best is not None:
            status = "optimal"
            point_str = ", ".join(
                f"{name} = {val:.6g}" for name, val in zip(self.var_names, best.point)
            )
            message = (
                f"Punto óptimo KKT en ({point_str}) con f = {best.objective_value:.6g} "
                f"(caso #{best.case_id})."
            )
        else:
            status = "infeasible"
            message = (
                "No se encontró ningún punto que satisfaga las condiciones KKT "
                "(factibilidad primal y dual) para las restricciones dadas."
            )

        return KKTSolveResult(
            status=status,
            variables=self.var_names,
            function_str=self.function_str,
            goal=self.goal,
            constraints_str=self.constraints_str,
            optimal_point=best.point if best else None,
            optimal_value=best.objective_value if best else None,
            optimal_case_id=best.case_id if best else None,
            cases=cases,
            cases_explored=len(cases),
            message=message,
        )
