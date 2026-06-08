"""
Binary Integer Programming — Branch & Bound
============================================
Solves BIP problems where every decision variable must be 0 or 1.

Algorithm
---------
1. Solve the LP relaxation (0 ≤ xᵢ ≤ 1) of the root node.
2. If all variables are integer → record as candidate, prune.
3. If LP bound ≤ best known integer value → prune (bound).
4. If LP is infeasible → prune (infeasible).
5. Branch on the most-fractional variable (closest to 0.5).
6. Repeat depth-first until no more nodes or node limit reached.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.core.simplex_engine import SimplexEngine

EPSILON = 1e-6
MAX_NODES = 500


@dataclass
class BBNodeInfo:
    node_id: int
    parent_id: int | None
    depth: int
    fixed_vars: dict[str, int]
    lp_value: float | None
    lp_vars: dict[str, float] | None
    status: str  # "branched" | "pruned_bound" | "pruned_infeasible" | "integer"
    branched_on: str | None = None
    edge_label: str | None = None


@dataclass
class BinaryResult:
    status: Literal["optimal", "infeasible", "limit"]
    objective_value: float | None = None
    variables: dict[str, int] | None = None
    nodes_explored: int = 0
    nodes: list[BBNodeInfo] = field(default_factory=list)
    message: str = ""


class BinaryEngine:
    """Branch-and-Bound solver for Binary Integer Programming."""

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

    def _solve_lp(self, fixed: dict[int, int]) -> tuple[str, float, list[float]]:
        """LP relaxation of the subproblem with some variables fixed to 0 or 1."""
        n = self.n
        A = [row[:] for row in self.A]
        b = list(self.b)
        ineq = list(self.ineq)

        # Upper bound xᵢ ≤ 1 for every binary variable
        for i in range(n):
            row = [0.0] * n
            row[i] = 1.0
            A.append(row)
            b.append(1.0)
            ineq.append("<=")

        # Fix variables: xᵢ = 0 → xᵢ ≤ 0;  xᵢ = 1 → xᵢ ≥ 1
        for i, val in fixed.items():
            row = [0.0] * n
            row[i] = 1.0
            if val == 0:
                A.append(row)
                b.append(0.0)
                ineq.append("<=")
            else:
                A.append(row)
                b.append(1.0)
                ineq.append(">=")

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

    def solve(self) -> BinaryResult:
        best_val = float("-inf") if self.goal == "max" else float("inf")
        best_vars: dict[str, int] | None = None
        nodes: list[BBNodeInfo] = []
        node_counter = 0

        # DFS stack: (fixed_vars_by_index, parent_id, depth, edge_label)
        stack: list[tuple[dict[int, int], int | None, int, str | None]] = [({}, None, 0, None)]

        while stack and len(nodes) < MAX_NODES:
            fixed, parent_id, depth, edge_label = stack.pop()
            node_id = node_counter
            node_counter += 1

            lp_status, lp_val, lp_vars_list = self._solve_lp(fixed)

            fixed_named = {f"x{i + 1}": v for i, v in fixed.items()}
            lp_vars_named = (
                {f"x{i + 1}": round(lp_vars_list[i], 6) for i in range(self.n)}
                if lp_vars_list
                else None
            )

            if lp_status != "optimal":
                nodes.append(BBNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    fixed_vars=fixed_named, lp_value=None, lp_vars=None,
                    status="pruned_infeasible", edge_label=edge_label,
                ))
                continue

            # Prune by bound
            if best_vars is not None and not self._is_better(lp_val, best_val):
                nodes.append(BBNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    fixed_vars=fixed_named, lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                    status="pruned_bound", edge_label=edge_label,
                ))
                continue

            # Fractional variables still to fix
            fractional = [
                (i, lp_vars_list[i])
                for i in range(self.n)
                if i not in fixed and abs(lp_vars_list[i] - round(lp_vars_list[i])) > EPSILON
            ]

            if not fractional:
                # All variables are integer → feasible integer solution
                if self._is_better(lp_val, best_val):
                    best_val = lp_val
                    best_vars = {f"x{i + 1}": int(round(lp_vars_list[i])) for i in range(self.n)}
                nodes.append(BBNodeInfo(
                    node_id=node_id, parent_id=parent_id, depth=depth,
                    fixed_vars=fixed_named, lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                    status="integer", edge_label=edge_label,
                ))
                continue

            # Branch on the most fractional variable (closest to 0.5)
            branch_idx = min(fractional, key=lambda t: abs(t[1] - 0.5))[0]
            branch_name = f"x{branch_idx + 1}"

            nodes.append(BBNodeInfo(
                node_id=node_id, parent_id=parent_id, depth=depth,
                fixed_vars=fixed_named, lp_value=round(lp_val, 6), lp_vars=lp_vars_named,
                status="branched", branched_on=branch_name, edge_label=edge_label,
            ))

            # Push both children (push 0 last so DFS explores 1 first, usually better for max)
            for val in [0, 1]:
                child_label = f"{branch_name} = {val}"
                stack.append(({**fixed, branch_idx: val}, node_id, depth + 1, child_label))

        if best_vars is None:
            return BinaryResult(
                status="infeasible",
                nodes_explored=len(nodes),
                nodes=nodes,
                message="No se encontró ninguna solución entera binaria factible.",
            )

        return BinaryResult(
            status="optimal",
            objective_value=round(best_val, 6),
            variables=best_vars,
            nodes_explored=len(nodes),
            nodes=nodes,
            message=(
                f"Solución óptima encontrada con valor Z = {round(best_val, 6)}. "
                f"Nodos explorados: {len(nodes)}."
            ),
        )
