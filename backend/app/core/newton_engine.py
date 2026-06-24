"""Optimización no restringida de una variable mediante el método de Newton-Raphson.

El método busca un punto estacionario (f'(x) = 0) mediante la iteración:

    x_{n+1} = x_n - f'(x_n) / f''(x_n)

Converge cuadráticamente cerca de la solución cuando f''(x*) ≠ 0.
La función se modela como un polinomio de una variable de cualquier grado.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from app.core.bisection_engine import poly_to_str


@dataclass
class NewtonIteration:
    iteration: int
    x_n: float
    f_xn: float
    df_xn: float
    d2f_xn: float
    x_next: float
    step: float


@dataclass
class NewtonResult:
    status: str                       # "optimal" | "no_convergence"
    optimal_x: float | None
    optimal_value: float | None
    nature: str | None                # "máximo" | "mínimo" | "punto de inflexión"
    goal_satisfied: bool
    iterations_count: int
    iterations: list[NewtonIteration] = field(default_factory=list)
    function_str: str = ""
    derivative_str: str = ""
    second_derivative_str: str = ""
    message: str = ""


class NewtonEngine:
    """Encuentra el óptimo de un polinomio de una variable por Newton-Raphson."""

    def __init__(
        self,
        coefficients: list[float],
        goal: str,
        x0: float,
        tolerance: float = 1e-6,
        max_iterations: int = 100,
    ) -> None:
        if len(coefficients) < 1:
            raise ValueError("Debe ingresar al menos un coeficiente.")
        if all(abs(c) < 1e-12 for c in coefficients):
            raise ValueError("La función no puede ser idénticamente cero.")

        self.coeffs = np.asarray(coefficients, dtype=float)
        self.goal = goal
        self.x0 = float(x0)
        self.tol = float(tolerance)
        self.max_iter = int(max_iterations)

        self.deriv = np.polyder(self.coeffs)
        self.deriv2 = np.polyder(self.deriv)

    def f(self, x: float) -> float:
        return float(np.polyval(self.coeffs, x))

    def df(self, x: float) -> float:
        return float(np.polyval(self.deriv, x))

    def d2f(self, x: float) -> float:
        return float(np.polyval(self.deriv2, x))

    def solve(self) -> NewtonResult:
        func_str = poly_to_str(self.coeffs.tolist())
        deriv_str = poly_to_str(self.deriv.tolist())
        d2_str = poly_to_str(self.deriv2.tolist())

        x = self.x0
        iterations: list[NewtonIteration] = []
        converged = False

        for i in range(1, self.max_iter + 1):
            fx = self.f(x)
            dfx = self.df(x)
            d2fx = self.d2f(x)

            if abs(d2fx) < 1e-14:
                raise ValueError(
                    f"La segunda derivada f''(x) ≈ 0 en x = {x:.6g}. "
                    "El método de Newton no puede continuar. "
                    "Pruebe otro punto inicial."
                )

            x_next = x - dfx / d2fx
            step = abs(x_next - x)

            iterations.append(
                NewtonIteration(
                    iteration=i,
                    x_n=x,
                    f_xn=fx,
                    df_xn=dfx,
                    d2f_xn=d2fx,
                    x_next=x_next,
                    step=step,
                )
            )

            x = x_next

            if abs(dfx) < self.tol or step < self.tol:
                converged = True
                break

        return self._build_result(iterations, x, func_str, deriv_str, d2_str, converged)

    def _build_result(
        self,
        iterations: list[NewtonIteration],
        x_star: float,
        func_str: str,
        deriv_str: str,
        d2_str: str,
        converged: bool,
    ) -> NewtonResult:
        second = self.d2f(x_star)
        if second > 1e-9:
            nature = "mínimo"
        elif second < -1e-9:
            nature = "máximo"
        else:
            nature = "punto de inflexión"

        goal_word = "máximo" if self.goal == "max" else "mínimo"
        goal_satisfied = nature == goal_word
        value = self.f(x_star)

        if not converged:
            status = "no_convergence"
            message = (
                f"El método no convergió en {self.max_iter} iteraciones. "
                f"Último x = {x_star:.6g}. "
                "Intente con otro punto inicial o aumente el número de iteraciones."
            )
        elif nature == "punto de inflexión":
            status = "optimal"
            message = (
                f"El método convergió a x = {x_star:.6g}, pero la segunda derivada es "
                "≈ 0: se trata de un punto de inflexión, no de un óptimo claro."
            )
        elif goal_satisfied:
            status = "optimal"
            message = (
                f"Óptimo encontrado: x = {x_star:.6g} es un {nature} de la función, "
                f"coincidiendo con la meta solicitada ({goal_word})."
            )
        else:
            status = "optimal"
            message = (
                f"El método convergió a un {nature} en x = {x_star:.6g}, pero usted "
                f"solicitó un {goal_word}. Pruebe un punto inicial en una región "
                "diferente de la función."
            )

        return NewtonResult(
            status=status,
            optimal_x=x_star,
            optimal_value=value,
            nature=nature,
            goal_satisfied=goal_satisfied,
            iterations_count=len(iterations),
            iterations=iterations,
            function_str=func_str,
            derivative_str=deriv_str,
            second_derivative_str=d2_str,
            message=message,
        )
