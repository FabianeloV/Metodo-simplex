"""
Simplex Method Engine
=====================
Pure-Python (+ NumPy) implementation of the revised simplex method.

Supports:
  - Maximization and minimization
  - Constraints:  <=, >= and =
  - 2, 3 or 4 decision variables
  - Detection of unbounded / infeasible problems

Internal representation
-----------------------
We work with the *standard equality form*:

  max  c^T x
  s.t. Ax = b,  x >= 0

Conversion:
  <= rhs  →  add slack  s_i  (+1 coefficient)
  >= rhs  →  subtract surplus  s_i  (-1 coefficient) + artificial  a_i  (+1)
  =  rhs  →  add artificial  a_i  (+1)

Phase I removes artificials; Phase II optimises.
For the common all-<= case this collapses to the classic one-phase simplex.
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass, field
from typing import Literal

EPSILON = 1e-8
MAX_ITER = 200


@dataclass
class SimplexResult:
    status: Literal["optimal", "unbounded", "infeasible"]
    objective_value: float = 0.0
    variables: dict[str, float] = field(default_factory=dict)
    iterations: int = 0
    tableau_headers: list[str] = field(default_factory=list)
    tableau_rows: list[dict] = field(default_factory=list)
    message: str = ""
    iteration_tableaux: list[dict] = field(default_factory=list)


class SimplexEngine:
    """
    Solves a linear programme using the Big-M method for mixed constraints.
    """

    BIG_M = 1e6

    def __init__(
        self,
        objective: list[float],
        goal: Literal["max", "min"],
        constraint_coeffs: list[list[float]],
        inequalities: list[Literal["<=", ">=", "="]],
        rhs_values: list[float],
    ) -> None:
        self.n_decision = len(objective)
        self.n_constraints = len(constraint_coeffs)
        self.goal = goal

        # Minimise → negate objective (convert to max internally)
        sign = 1.0 if goal == "max" else -1.0
        self.c_orig = np.array(objective, dtype=float)
        self.c = sign * self.c_orig

        self.A_orig = np.array(constraint_coeffs, dtype=float)
        self.inequalities = inequalities
        self.b = np.array(rhs_values, dtype=float)

        # Ensure b >= 0 (flip row if needed)
        for i in range(self.n_constraints):
            if self.b[i] < 0:
                self.b[i] *= -1
                self.A_orig[i] *= -1
                if self.inequalities[i] == "<=":
                    self.inequalities[i] = ">="
                elif self.inequalities[i] == ">=":
                    self.inequalities[i] = "<="

        self._build_tableau()

    # ------------------------------------------------------------------
    # Tableau construction
    # ------------------------------------------------------------------

    def _build_tableau(self) -> None:
        m = self.n_constraints
        n = self.n_decision

        # Count auxiliary variables
        n_slack = sum(1 for ineq in self.inequalities if ineq == "<=")
        n_surplus = sum(1 for ineq in self.inequalities if ineq == ">=")
        n_artificial = sum(1 for ineq in self.inequalities if ineq in (">=", "="))
        n_total = n + n_slack + n_surplus + n_artificial

        # Build variable name lists
        x_names = [f"x{i+1}" for i in range(n)]
        s_names: list[str] = []
        surplus_names: list[str] = []
        a_names: list[str] = []

        slack_idx = n
        surplus_idx = n + n_slack
        art_idx = n + n_slack + n_surplus

        self.var_names = x_names[:]
        slack_col = n
        surplus_col = n + n_slack
        art_col = n + n_slack + n_surplus

        # Constraint matrix [A | I_slack | -I_surplus | I_art | b]
        T = np.zeros((m, n_total + 1))
        T[:, :n] = self.A_orig
        T[:, -1] = self.b

        basic: list[int] = []
        s_cnt = 0
        sr_cnt = 0
        a_cnt = 0

        for i, ineq in enumerate(self.inequalities):
            if ineq == "<=":
                col = slack_col + s_cnt
                T[i, col] = 1.0
                basic.append(col)
                s_cnt += 1
                s_names.append(f"s{s_cnt}")
            elif ineq == ">=":
                sr_col = surplus_col + sr_cnt
                a_col_i = art_col + a_cnt
                T[i, sr_col] = -1.0
                T[i, a_col_i] = 1.0
                basic.append(a_col_i)
                sr_cnt += 1
                a_cnt += 1
                surplus_names.append(f"sr{sr_cnt}")
                a_names.append(f"a{a_cnt}")
            else:  # "="
                a_col_i = art_col + a_cnt
                T[i, a_col_i] = 1.0
                basic.append(a_col_i)
                a_cnt += 1
                a_names.append(f"a{a_cnt}")

        self.var_names += s_names + surplus_names + a_names
        self.n_total = n_total
        self.n_artificial = n_artificial
        self.art_col_start = art_col
        self.basic = basic

        # Objective row (negated for max form): z - c^T x = 0
        obj_row = np.zeros(n_total + 1)
        obj_row[:n] = -self.c
        # Big-M penalty for artificials
        for j in range(n_artificial):
            obj_row[art_col + j] = self.BIG_M

        # Eliminate artificials already in basis from obj row
        for i, bv in enumerate(basic):
            if bv >= art_col:
                obj_row -= obj_row[bv] * T[i]

        self.T = np.vstack([T, obj_row])
        self.basic = basic  # length m

    # ------------------------------------------------------------------
    # Pivot operations
    # ------------------------------------------------------------------

    def _pivot(self, pivot_row: int, pivot_col: int) -> None:
        self.T[pivot_row] /= self.T[pivot_row, pivot_col]
        for i in range(len(self.T)):
            if i != pivot_row:
                self.T[i] -= self.T[i, pivot_col] * self.T[pivot_row]
        self.basic[pivot_row] = pivot_col

    def _find_pivot_col(self) -> int:
        """Most negative coefficient in the objective row (columns 0..n_total-1)."""
        obj = self.T[-1, : self.n_total]
        col = int(np.argmin(obj))
        return col if obj[col] < -EPSILON else -1

    def _snapshot(self, iteration: int, entering: str | None, leaving: str | None) -> dict:
        display_cols = self.n_total - self.n_artificial
        headers = ["Básica", "Z"] + self.var_names[:display_cols] + ["RHS"]
        m = len(self.basic)
        rows: list[dict] = []
        for i in range(m):
            bv_name = self.var_names[self.basic[i]] if self.basic[i] < len(self.var_names) else "?"
            row_vals = [0.0] + list(self.T[i, :display_cols]) + [float(self.T[i, -1])]
            rows.append({"basic_variable": bv_name, "values": _round_list(row_vals)})
        z_row = [1.0] + list(self.T[-1, :display_cols]) + [float(self.T[-1, -1])]
        rows.append({"basic_variable": "Z", "values": _round_list(z_row)})
        return {
            "iteration": iteration,
            "entering": entering,
            "leaving": leaving,
            "tableau_headers": headers,
            "tableau_rows": rows,
        }

    def _find_pivot_row(self, col: int) -> int:
        """Minimum ratio test."""
        m = len(self.basic)
        col_vals = self.T[:m, col]
        rhs_vals = self.T[:m, -1]
        ratios = np.full(m, np.inf)
        for i in range(m):
            if col_vals[i] > EPSILON:
                ratios[i] = rhs_vals[i] / col_vals[i]
        idx = int(np.argmin(ratios))
        return idx if ratios[idx] < np.inf else -1

    # ------------------------------------------------------------------
    # Solve
    # ------------------------------------------------------------------

    def solve(self) -> SimplexResult:
        iteration_snapshots: list[dict] = [self._snapshot(0, None, None)]
        iterations = 0
        for _ in range(MAX_ITER):
            pcol = self._find_pivot_col()
            if pcol == -1:
                break
            prow = self._find_pivot_row(pcol)
            if prow == -1:
                return SimplexResult(
                    status="unbounded",
                    message="El problema no está acotado: no existe un óptimo finito.",
                )
            entering = self.var_names[pcol] if pcol < len(self.var_names) else "?"
            leaving = self.var_names[self.basic[prow]] if self.basic[prow] < len(self.var_names) else "?"
            self._pivot(prow, pcol)
            iterations += 1
            iteration_snapshots.append(self._snapshot(iterations, entering, leaving))

        # Check for artificials still in basis (infeasible)
        for bv in self.basic:
            if bv >= self.art_col_start:
                rhs_val = self.T[self.basic.index(bv), -1]
                if abs(rhs_val) > EPSILON:
                    return SimplexResult(
                        status="infeasible",
                        message="El problema no tiene una solución factible.",
                    )

        # Extract solution
        m = len(self.basic)
        obj_val_internal = self.T[-1, -1]
        obj_val = obj_val_internal if self.goal == "max" else -obj_val_internal

        x_vals: dict[str, float] = {name: 0.0 for name in self.var_names[: self.n_decision]}
        for i, bv in enumerate(self.basic):
            if bv < self.n_decision:
                x_vals[self.var_names[bv]] = round(float(self.T[i, -1]), 8)

        # Build final tableau for display (only decision + slack rows, no artificials)
        display_cols = self.n_total - self.n_artificial
        headers = ["Básica", "Z"] + self.var_names[:display_cols] + ["RHS"]

        tableau_rows: list[dict] = []
        for i in range(m):
            bv_name = self.var_names[self.basic[i]] if self.basic[i] < len(self.var_names) else "?"
            row_vals = [0.0] + list(self.T[i, :display_cols]) + [float(self.T[i, -1])]
            tableau_rows.append({"basic_variable": bv_name, "values": _round_list(row_vals)})

        z_row = [1.0] + list(self.T[-1, :display_cols]) + [float(self.T[-1, -1])]
        tableau_rows.append({"basic_variable": "Z", "values": _round_list(z_row)})

        return SimplexResult(
            status="optimal",
            objective_value=round(obj_val, 8),
            variables={k: round(v, 8) for k, v in x_vals.items()},
            iterations=iterations,
            tableau_headers=headers,
            tableau_rows=tableau_rows,
            message=f"Se encontró una solución óptima después de {iterations} iteración(es).",
            iteration_tableaux=iteration_snapshots,
        )


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _round_list(lst: list[float], decimals: int = 6) -> list[float]:
    return [float(round(float(v), decimals)) for v in lst]
