"""Optimización no restringida de varias variables por el método del gradiente.

La iteración es:
    x^(k+1) = x^k - α · ∇f(x^k)   (minimización)
    x^(k+1) = x^k + α · ∇f(x^k)   (maximización)

Se detiene cuando ‖∇f(x^k)‖ < tolerancia.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from sympy import symbols, sympify, diff, lambdify


@dataclass
class GradientIteration:
    iteration: int
    point: list[float]
    gradient: list[float]
    gradient_norm: float
    f_value: float


@dataclass
class GradientResult:
    status: str
    optimal_point: list[float] | None
    optimal_value: float | None
    gradient_norm: float | None
    iterations_count: int
    iterations: list[GradientIteration] = field(default_factory=list)
    function_str: str = ""
    gradient_str: list[str] = field(default_factory=list)
    variables: list[str] = field(default_factory=list)
    message: str = ""


class GradientEngine:
    """Encuentra el óptimo de f(x₁,…,xₙ) por descenso/ascenso de gradiente."""

    def __init__(
        self,
        expression: str,
        variables: list[str],
        x0: list[float],
        goal: str,
        step_size: float = 0.1,
        tolerance: float = 1e-6,
        max_iterations: int = 100,
    ) -> None:
        if not (2 <= len(variables) <= 3):
            raise ValueError("Se soportan 2 o 3 variables.")
        if len(x0) != len(variables):
            raise ValueError("x0 debe tener el mismo número de elementos que variables.")

        self.var_names = variables
        self.syms = symbols(variables)
        if not isinstance(self.syms, (tuple, list)):
            self.syms = (self.syms,)

        try:
            self.expr = sympify(expression)
        except Exception as exc:
            raise ValueError(f"Expresión inválida: {exc}") from exc

        self.grad_exprs = [diff(self.expr, v) for v in self.syms]
        self.f_func = lambdify(self.syms, self.expr, "numpy")
        self.grad_funcs = [lambdify(self.syms, g, "numpy") for g in self.grad_exprs]

        self.x0 = np.array(x0, dtype=float)
        self.goal = goal
        self.step = float(step_size)
        self.tol = float(tolerance)
        self.max_iter = int(max_iterations)

        self.function_str = str(self.expr)
        self.gradient_str = [str(g) for g in self.grad_exprs]

    def _eval_f(self, x: np.ndarray) -> float:
        return float(self.f_func(*x))

    def _eval_grad(self, x: np.ndarray) -> np.ndarray:
        return np.array([float(g(*x)) for g in self.grad_funcs])

    def solve(self) -> GradientResult:
        x = self.x0.copy()
        direction = -1.0 if self.goal == "min" else 1.0
        iterations: list[GradientIteration] = []
        converged = False

        for i in range(1, self.max_iter + 1):
            f_val = self._eval_f(x)
            grad = self._eval_grad(x)
            grad_norm = float(np.linalg.norm(grad))

            iterations.append(
                GradientIteration(
                    iteration=i,
                    point=x.tolist(),
                    gradient=grad.tolist(),
                    gradient_norm=grad_norm,
                    f_value=f_val,
                )
            )

            if grad_norm < self.tol:
                converged = True
                break

            x_next = x + direction * self.step * grad

            if not np.all(np.isfinite(x_next)):
                raise ValueError(
                    "El método divergió. Pruebe un tamaño de paso más pequeño "
                    "o un punto inicial diferente."
                )

            x = x_next

        return self._build_result(iterations, x, converged)

    def _build_result(
        self,
        iterations: list[GradientIteration],
        x_star: np.ndarray,
        converged: bool,
    ) -> GradientResult:
        f_star = self._eval_f(x_star)
        grad_norm = float(np.linalg.norm(self._eval_grad(x_star)))

        point_str = ", ".join(
            f"{name} = {val:.6g}" for name, val in zip(self.var_names, x_star)
        )

        if converged:
            status = "optimal"
            message = (
                f"El método convergió al punto ({point_str}) "
                f"con f = {f_star:.6g} y ‖∇f‖ = {grad_norm:.2e}."
            )
        else:
            status = "no_convergence"
            message = (
                f"El método no convergió en {self.max_iter} iteraciones. "
                f"Último punto: ({point_str}). "
                "Intente reducir el paso, aumentar las iteraciones o cambiar el punto inicial."
            )

        return GradientResult(
            status=status,
            optimal_point=x_star.tolist(),
            optimal_value=f_star,
            gradient_norm=grad_norm,
            iterations_count=len(iterations),
            iterations=iterations,
            function_str=self.function_str,
            gradient_str=self.gradient_str,
            variables=self.var_names,
            message=message,
        )
