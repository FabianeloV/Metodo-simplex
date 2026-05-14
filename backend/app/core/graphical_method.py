from __future__ import annotations

from dataclasses import dataclass
from math import atan2
from typing import Literal

EPSILON = 1e-8
ROUND_DECIMALS = 6


@dataclass(frozen=True)
class Constraint2D:
    a: float
    b: float
    inequality: Literal["<=", ">=", "="]
    rhs: float
    label: str


@dataclass(frozen=True)
class Bounds:
    x_min: float
    x_max: float
    y_min: float
    y_max: float


def build_graphical_data(
    *,
    objective: list[float],
    goal: Literal["max", "min"],
    constraint_coeffs: list[list[float]],
    inequalities: list[Literal["<=", ">=", "="]],
    rhs_values: list[float],
    status: Literal["optimal", "unbounded", "infeasible"],
    optimal_point: dict[str, float] | None,
    objective_value: float | None,
) -> dict:
    constraints = _build_constraints(constraint_coeffs, inequalities, rhs_values)
    constraints_with_nonneg = constraints + _nonneg_constraints()

    feasible_points = _feasible_intersections(constraints_with_nonneg)
    bounds = _compute_bounds(constraints_with_nonneg, feasible_points, optimal_point)

    constraint_lines = []
    for c in constraints:
        segment = _line_segment_in_bounds(c.a, c.b, c.rhs, bounds)
        if len(segment) == 2:
            constraint_lines.append(
                {
                    "a": _round(c.a),
                    "b": _round(c.b),
                    "c": _round(c.rhs),
                    "points": [_round_point(*segment[0]), _round_point(*segment[1])],
                    "label": c.label,
                    "inequality": c.inequality,
                }
            )

    polygon = _polygon_from_points(feasible_points)
    vertices = [_round_point(p[0], p[1]) for p in _sort_points(feasible_points)]

    objective_line = None
    if objective_value is not None and (abs(objective[0]) > EPSILON or abs(objective[1]) > EPSILON):
        segment = _line_segment_in_bounds(objective[0], objective[1], objective_value, bounds)
        if len(segment) == 2:
            objective_line = {
                "a": _round(objective[0]),
                "b": _round(objective[1]),
                "c": _round(objective_value),
                "points": [_round_point(*segment[0]), _round_point(*segment[1])],
                "label": "objetivo",
            }

    optimal = None
    if optimal_point is not None:
        optimal = _round_point(optimal_point.get("x", 0.0), optimal_point.get("y", 0.0))

    return {
        "status": status,
        "bounds": {
            "x_min": _round(bounds.x_min),
            "x_max": _round(bounds.x_max),
            "y_min": _round(bounds.y_min),
            "y_max": _round(bounds.y_max),
        },
        "constraints": constraint_lines,
        "feasible_polygon": polygon,
        "vertices": vertices,
        "objective_line": objective_line,
        "optimal_point": optimal,
        "objective_value": _round(objective_value) if objective_value is not None else None,
        "goal": goal,
    }


# -----------------------------------------------------------------------------
# Internal helpers
# -----------------------------------------------------------------------------


def _build_constraints(
    coeffs: list[list[float]],
    inequalities: list[Literal["<=", ">=", "="]],
    rhs_values: list[float],
) -> list[Constraint2D]:
    constraints: list[Constraint2D] = []
    for i, (row, ineq, rhs) in enumerate(zip(coeffs, inequalities, rhs_values, strict=True)):
        constraints.append(
            Constraint2D(
                a=float(row[0]),
                b=float(row[1]),
                inequality=ineq,
                rhs=float(rhs),
                label=f"c{i + 1}",
            )
        )
    return constraints


def _nonneg_constraints() -> list[Constraint2D]:
    return [
        Constraint2D(a=1.0, b=0.0, inequality=">=", rhs=0.0, label="x>=0"),
        Constraint2D(a=0.0, b=1.0, inequality=">=", rhs=0.0, label="y>=0"),
    ]


def _feasible_intersections(constraints: list[Constraint2D]) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for i in range(len(constraints)):
        for j in range(i + 1, len(constraints)):
            p = _intersection(constraints[i], constraints[j])
            if p is None:
                continue
            if all(_satisfies(c, p[0], p[1]) for c in constraints):
                points.append(p)
    return _unique_points(points)


def _intersection(c1: Constraint2D, c2: Constraint2D) -> tuple[float, float] | None:
    det = c1.a * c2.b - c2.a * c1.b
    if abs(det) < EPSILON:
        return None
    x = (c1.rhs * c2.b - c2.rhs * c1.b) / det
    y = (c1.a * c2.rhs - c2.a * c1.rhs) / det
    return (x, y)


def _satisfies(c: Constraint2D, x: float, y: float) -> bool:
    value = c.a * x + c.b * y
    if c.inequality == "<=" :
        return value <= c.rhs + EPSILON
    if c.inequality == ">=":
        return value >= c.rhs - EPSILON
    return abs(value - c.rhs) <= EPSILON


def _unique_points(points: list[tuple[float, float]], tol: float = 1e-6) -> list[tuple[float, float]]:
    unique: list[tuple[float, float]] = []
    for p in points:
        if not any(abs(p[0] - q[0]) < tol and abs(p[1] - q[1]) < tol for q in unique):
            unique.append(p)
    return unique


def _compute_bounds(
    constraints: list[Constraint2D],
    feasible_points: list[tuple[float, float]],
    optimal_point: dict[str, float] | None,
) -> Bounds:
    xs: list[float] = []
    ys: list[float] = []

    for x, y in feasible_points:
        if x >= -EPSILON:
            xs.append(x)
        if y >= -EPSILON:
            ys.append(y)

    for c in constraints:
        if abs(c.a) > EPSILON:
            x = c.rhs / c.a
            if x >= -EPSILON:
                xs.append(x)
        if abs(c.b) > EPSILON:
            y = c.rhs / c.b
            if y >= -EPSILON:
                ys.append(y)

    if optimal_point is not None:
        xs.append(optimal_point.get("x", 0.0))
        ys.append(optimal_point.get("y", 0.0))

    x_max = max([v for v in xs if v >= 0.0], default=1.0)
    y_max = max([v for v in ys if v >= 0.0], default=1.0)

    x_max = max(1.0, x_max)
    y_max = max(1.0, y_max)

    margin = 0.15
    return Bounds(x_min=0.0, y_min=0.0, x_max=x_max * (1.0 + margin), y_max=y_max * (1.0 + margin))


def _line_segment_in_bounds(a: float, b: float, c: float, bounds: Bounds) -> list[tuple[float, float]]:
    if abs(a) < EPSILON and abs(b) < EPSILON:
        return []

    points: list[tuple[float, float]] = []

    if abs(b) > EPSILON:
        y = (c - a * bounds.x_min) / b
        if _within_bounds(bounds.x_min, y, bounds):
            points.append((bounds.x_min, y))
        y = (c - a * bounds.x_max) / b
        if _within_bounds(bounds.x_max, y, bounds):
            points.append((bounds.x_max, y))

    if abs(a) > EPSILON:
        x = (c - b * bounds.y_min) / a
        if _within_bounds(x, bounds.y_min, bounds):
            points.append((x, bounds.y_min))
        x = (c - b * bounds.y_max) / a
        if _within_bounds(x, bounds.y_max, bounds):
            points.append((x, bounds.y_max))

    points = _unique_points(points)
    if len(points) < 2:
        return []

    points = _sort_points(points)
    return [points[0], points[-1]]


def _within_bounds(x: float, y: float, bounds: Bounds) -> bool:
    return (
        bounds.x_min - EPSILON <= x <= bounds.x_max + EPSILON
        and bounds.y_min - EPSILON <= y <= bounds.y_max + EPSILON
    )


def _polygon_from_points(points: list[tuple[float, float]]) -> list[dict] | None:
    if len(points) < 3:
        return None
    ordered = _sort_points(points)
    area = _polygon_area(ordered)
    if area < 1e-6:
        return None
    return [_round_point(p[0], p[1]) for p in ordered]


def _sort_points(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if len(points) <= 2:
        return sorted(points)
    cx = sum(p[0] for p in points) / len(points)
    cy = sum(p[1] for p in points) / len(points)
    return sorted(points, key=lambda p: atan2(p[1] - cy, p[0] - cx))


def _polygon_area(points: list[tuple[float, float]]) -> float:
    area = 0.0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i + 1) % len(points)]
        area += x1 * y2 - x2 * y1
    return abs(area) * 0.5


def _round(value: float) -> float:
    if value is None:
        return 0.0
    if abs(value) < EPSILON:
        value = 0.0
    return float(round(float(value), ROUND_DECIMALS))


def _round_point(x: float, y: float) -> dict:
    return {"x": _round(x), "y": _round(y)}
