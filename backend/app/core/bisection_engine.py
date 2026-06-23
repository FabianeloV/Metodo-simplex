"""Optimización no restringida de una variable mediante el método de bisección.

El método de bisección busca un punto estacionario (f'(x) = 0) de una función de
una sola variable dentro de un intervalo [a, b]. Para ello se evalúa el signo de
la derivada en los extremos: si f'(a) y f'(b) tienen signos opuestos, existe al
menos un punto donde la derivada se anula, y se va reduciendo el intervalo a la
mitad en cada iteración hasta alcanzar la tolerancia deseada.

La función se modela como un polinomio de una variable de cualquier grado, dado
por sus coeficientes en orden de mayor a menor grado (convención de NumPy):

    coefficients = [c_n, c_{n-1}, ..., c_1, c_0]
    f(x) = c_n·xⁿ + c_{n-1}·xⁿ⁻¹ + ... + c_1·x + c_0
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np


@dataclass
class BisectionIteration:
    iteration: int
    a: float
    b: float
    midpoint: float
    f_mid: float
    df_mid: float
    interval_width: float


@dataclass
class BisectionResult:
    status: str  # "optimal"
    optimal_x: float | None
    optimal_value: float | None
    nature: str | None              # "máximo" | "mínimo" | "punto de inflexión"
    goal_satisfied: bool
    iterations_count: int
    iterations: list[BisectionIteration] = field(default_factory=list)
    function_str: str = ""
    derivative_str: str = ""
    message: str = ""


_SUPERSCRIPT = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def _superscript(n: int) -> str:
    return str(n).translate(_SUPERSCRIPT)


def poly_to_str(coeffs: list[float], var: str = "x") -> str:
    """Convierte una lista de coeficientes (mayor a menor grado) en texto legible."""
    degree = len(coeffs) - 1
    terms: list[str] = []
    for idx, c in enumerate(coeffs):
        power = degree - idx
        if abs(c) < 1e-12:
            continue

        coef = abs(c)
        # Formato compacto: entero sin decimales, resto con hasta 4 cifras
        coef_str = str(int(coef)) if float(coef).is_integer() else f"{coef:g}"

        if power == 0:
            body = coef_str
        elif power == 1:
            body = var if coef == 1 else f"{coef_str}{var}"
        else:
            unit = f"{var}{_superscript(power)}"
            body = unit if coef == 1 else f"{coef_str}{unit}"

        sign = "-" if c < 0 else "+"
        terms.append((sign, body))

    if not terms:
        return "0"

    first_sign, first_body = terms[0]
    out = ("-" if first_sign == "-" else "") + first_body
    for sign, body in terms[1:]:
        out += f" {sign} {body}"
    return out


class BisectionEngine:
    """Encuentra el óptimo de un polinomio de una variable por bisección de f'(x)."""

    def __init__(
        self,
        coefficients: list[float],
        goal: str,
        a: float,
        b: float,
        tolerance: float = 1e-6,
        max_iterations: int = 100,
    ) -> None:
        if len(coefficients) < 1:
            raise ValueError("Debe ingresar al menos un coeficiente.")
        if all(abs(c) < 1e-12 for c in coefficients):
            raise ValueError("La función no puede ser idénticamente cero.")

        self.coeffs = np.asarray(coefficients, dtype=float)
        self.goal = goal
        self.a = float(a)
        self.b = float(b)
        self.tol = float(tolerance)
        self.max_iter = int(max_iterations)

        # Derivadas analíticas (regla de la potencia, vía NumPy)
        self.deriv = np.polyder(self.coeffs)
        self.deriv2 = np.polyder(self.deriv)

    # ── Evaluadores ─────────────────────────────────────────────────────────
    def f(self, x: float) -> float:
        return float(np.polyval(self.coeffs, x))

    def df(self, x: float) -> float:
        return float(np.polyval(self.deriv, x))

    def d2f(self, x: float) -> float:
        return float(np.polyval(self.deriv2, x))

    # ── Resolución ──────────────────────────────────────────────────────────
    def solve(self) -> BisectionResult:
        a, b = self.a, self.b
        if a >= b:
            raise ValueError("El intervalo debe cumplir a < b.")

        func_str = poly_to_str(self.coeffs.tolist())
        deriv_str = poly_to_str(self.deriv.tolist())

        fa, fb = self.df(a), self.df(b)

        # Caso: un extremo ya es estacionario
        if abs(fa) < self.tol:
            return self._build_result([], a, func_str, deriv_str)
        if abs(fb) < self.tol:
            return self._build_result([], b, func_str, deriv_str)

        if fa * fb > 0:
            raise ValueError(
                "f'(a) y f'(b) tienen el mismo signo, por lo que no se puede "
                "garantizar un punto estacionario (óptimo) en el interior de "
                "[a, b]. Ajuste el intervalo para que la derivada cambie de signo."
            )

        lo, hi = a, b
        f_lo = fa
        iterations: list[BisectionIteration] = []
        midpoint = (lo + hi) / 2.0

        for i in range(1, self.max_iter + 1):
            midpoint = (lo + hi) / 2.0
            f_mid = self.df(midpoint)
            width = (hi - lo) / 2.0

            iterations.append(
                BisectionIteration(
                    iteration=i,
                    a=lo,
                    b=hi,
                    midpoint=midpoint,
                    f_mid=self.f(midpoint),
                    df_mid=f_mid,
                    interval_width=width,
                )
            )

            if abs(f_mid) < self.tol or width < self.tol:
                break

            if f_lo * f_mid < 0:
                hi = midpoint
            else:
                lo = midpoint
                f_lo = f_mid

        return self._build_result(iterations, midpoint, func_str, deriv_str)

    # ── Construcción del resultado + clasificación del punto ─────────────────
    def _build_result(
        self,
        iterations: list[BisectionIteration],
        x_star: float,
        func_str: str,
        deriv_str: str,
    ) -> BisectionResult:
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

        if nature == "punto de inflexión":
            message = (
                f"El método convergió a x = {x_star:.6g}, pero la segunda derivada es "
                "≈ 0: se trata de un punto de inflexión, no de un óptimo claro."
            )
        elif goal_satisfied:
            message = (
                f"Óptimo encontrado: el punto x = {x_star:.6g} es un {nature} de la "
                f"función, coincidiendo con la meta solicitada ({goal_word})."
            )
        else:
            message = (
                f"El método convergió a un {nature} en x = {x_star:.6g}, pero usted "
                f"solicitó un {goal_word}. Para una función unimodal en [a, b] revise "
                "el intervalo: el óptimo del tipo buscado podría estar en un extremo."
            )

        return BisectionResult(
            status="optimal",
            optimal_x=x_star,
            optimal_value=value,
            nature=nature,
            goal_satisfied=goal_satisfied,
            iterations_count=len(iterations),
            iterations=iterations,
            function_str=func_str,
            derivative_str=deriv_str,
            message=message,
        )
