"""
Pure Integer Programming — Branch & Bound
==========================================
Solves IP problems where every decision variable must be a non-negative integer.

Algorithm
---------
1. Solve the LP relaxation (no integrality constraints) at the root.
2. If all variables are already integer  → record as candidate, prune.
3. If LP bound ≤ best known integer value → prune (bound).
4. If LP is infeasible / unbounded       → prune.
5. Branch on the most-fractional variable (fractional part closest to 0.5):
   - Left  child: add xᵢ ≤ floor(v)
   - Right child: add xᵢ ≥ ceil(v)
6. Repeat depth-first until no more nodes or node limit reached.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Literal

from app.core.simplex_engine import SimplexEngine

EPSILON = 1e-6
MAX_NODES = 500


@dataclass
class IntegerNodeInfo:
    node_id: int
    parent_id: int | None
    depth: int
    lower_bounds: dict[str, float]   # accumulated  xᵢ ≥ lb  constraints
    upper_bounds: dict[str, float]   # accumulated  xᵢ ≤ ub  constraints
    lp_value: float | None
    lp_vars: dict[str, float] | None
    status: str   # "branched" | "pruned_bound" | "pruned_infeasible" | "integer"
    branched_on: str | None = None
    branch_direction: str | None = None  # "floor" | "ceil"
    edge_label: str | None = None


@dataclass
class IntegerResult:
    status: Literal["optimal", "infeasible", "limit"]
    objective_value: float | None = None
    variables: dict[str, int] | None = None
    nodes_explored: int = 0
    nodes: list[IntegerNodeInfo] = field(default_factory=list)
    message: str = ""


class IntegerEngine:
    """Branch-and-Bound solver for Pure Integer Programming."""

    def __init__(
        self,
        objective: list[float],
        goal: Literal["max", "min"],
        constraint_coeffs: list[list[float]],
        inequalities: list[Literal["<=", ">=", "="]],
        rhs_values: list[float],
    ) -> None:
        self.n = len(objective)
        self.objective = objective
        self.goal = goal
        self.A = constraint_coeffs
        self.ineq = inequalities
        self.b = rhs_values

    def _is_better(self, candidate: float, incumbent: float) -> bool:
        if self.goal == "max":
            return candidate > incumbent + EPSILON
        return candidate < incumbent - EPSILON

    def _solve_lp(
        self,
        lower: dict[int, float],
        upper: dict[int, float],
    ) -> tuple[str, float, list[float]]:
        """LP relaxation with accumulated branching bounds."""
        n = self.n
        A = [row[:] for row in self.A]
        b = list(self.b)
        ineq = list(self.ineq)

        for i, lb in lower.items():
            row = [0.0] * n
            row[i] = 1.0
            A.append(row)
            b.append(lb)
            ineq.append(">=")

        for i, ub in upper.items():
            row = [0.0] * n
            row[i] = 1.0
            A.append(row)
            b.append(ub)
            ineq.append("<=")

        try:
            engine = SimplexEngine(
                objective=self.objective,
                goal=self.goal,
                constraint_coeffs=A,
                inequalities=ineq,
                rhs_values=b,
            )
            result = engine.solve()
        except Exception:
            return "infeasible", 0.0, []

        if result.status != "optimal":
            return result.status, 0.0, []

        vals = [result.variables.get(f"x{i + 1}", 0.0) for i in range(n)]
        return "optimal", result.objective_value, vals

    def solve(self) -> IntegerResult:
        best_val = float("-inf") if self.goal == "max" else float("inf")
        best_vars: dict[str, int] | None = None
        nodes: list[IntegerNodeInfo] = []
        node_counter = 0

        # DFS stack: (lower_bounds, upper_bounds, parent_id, depth, branch_direction, edge_label)
        stack: list[tuple[dict[int, float], dict[int, float], int | None, int, str | None, str | None]] = [
            ({}, {}, None, 0, None, None)
        ]

        while stack and len(nodes) < MAX_NODES:
            lower, upper, parent_id, depth, branch_dir, edge_label = stack.pop()
            node_id = node_counter
            node_counter += 1

            lp_status, lp_val, lp_vars_list = self._solve_lp(lower, upper)

            lower_named = {f"x{i + 1}": v for i, v in lower.items()}
            upper_named = {f"x{i + 1}": v for i, v in upper.items()}
            lp_vars_named = (
                {f"x{i + 1}": round(lp_vars_list[i], 6) for i in range(self.n)}
                if lp_vars_list
                else None
            )

            if lp_status != "optimal":
                nodes.append(IntegerNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    lower_bounds=lower_named, upper_bounds=upper_named,
                    lp_value=None, lp_vars=None,
                    status="pruned_infeasible",
                    branch_direction=branch_dir, edge_label=edge_label,
                ))
                continue

            # Prune by bound
            if best_vars is not None and not self._is_better(lp_val, best_val):
                nodes.append(IntegerNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    lower_bounds=lower_named, upper_bounds=upper_named,
                    lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                    status="pruned_bound",
                    branch_direction=branch_dir, edge_label=edge_label,
                ))
                continue

            # Fractional variables
            fractional = [
                (i, lp_vars_list[i])
                for i in range(self.n)
                if abs(lp_vars_list[i] - round(lp_vars_list[i])) > EPSILON
            ]

            if not fractional:
                if self._is_better(lp_val, best_val):
                    best_val = lp_val
                    best_vars = {
                        f"x{i + 1}": int(round(lp_vars_list[i]))
                        for i in range(self.n)
                    }
                nodes.append(IntegerNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    lower_bounds=lower_named, upper_bounds=upper_named,
                    lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                    status="integer",
                    branch_direction=branch_dir, edge_label=edge_label,
                ))
                continue

            # Branch on most-fractional variable (fractional part closest to 0.5)
            branch_idx = min(
                fractional,
                key=lambda t: abs((t[1] - math.floor(t[1])) - 0.5),
            )[0]
            branch_val = lp_vars_list[branch_idx]
            floor_val = math.floor(branch_val)
            ceil_val = math.ceil(branch_val)
            branch_name = f"x{branch_idx + 1}"

            nodes.append(IntegerNodeInfo(
                node_id=node_id, parent_id=parent_id, depth=depth,
                lower_bounds=lower_named, upper_bounds=upper_named,
                lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                status="branched", branched_on=branch_name,
                branch_direction=branch_dir, edge_label=edge_label,
            ))

            # Push floor branch last so DFS explores ceil (usually tighter) first
            floor_upper = {**upper, branch_idx: float(floor_val)}
            stack.append(({**lower}, floor_upper, node_id, depth + 1, "floor",
                          f"{branch_name} ≤ {int(floor_val)}"))

            ceil_lower = {**lower, branch_idx: float(ceil_val)}
            stack.append((ceil_lower, {**upper}, node_id, depth + 1, "ceil",
                          f"{branch_name} ≥ {int(ceil_val)}"))

        if best_vars is None:
            if len(nodes) >= MAX_NODES:
                return IntegerResult(
                    status="limit",
                    nodes_explored=len(nodes),
                    nodes=nodes,
                    message=f"Se alcanzó el límite de {MAX_NODES} nodos sin encontrar solución entera.",
                )
            return IntegerResult(
                status="infeasible",
                nodes_explored=len(nodes),
                nodes=nodes,
                message="No existe solución entera factible para este problema.",
            )

        status_label = "limit" if len(nodes) >= MAX_NODES else "optimal"
        return IntegerResult(
            status=status_label,
            objective_value=round(best_val, 6),
            variables=best_vars,
            nodes_explored=len(nodes),
            nodes=nodes,
            message=(
                f"Solución entera óptima: Z = {round(best_val, 6)}. "
                f"Nodos explorados: {len(nodes)}."
            ),
        )
