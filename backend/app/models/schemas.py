from pydantic import BaseModel, Field, field_validator
from typing import Literal


class Constraint(BaseModel):
    coefficients: list[float] = Field(..., min_length=2, max_length=5)
    inequality: Literal["<=", ">=", "="]
    rhs: float

    @field_validator("coefficients")
    @classmethod
    def check_length(cls, v: list[float]) -> list[float]:
        if not (2 <= len(v) <= 5):
            raise ValueError("Los coeficientes deben estar entre 2 y 5 elementos")
        return v


class SimplexRequest(BaseModel):
    objective: list[float] = Field(..., min_length=2, max_length=5)
    goal: Literal["max", "min"]
    constraints: list[Constraint] = Field(..., min_length=1)

    @field_validator("constraints")
    @classmethod
    def same_size(cls, v: list[Constraint], info) -> list[Constraint]:
        if "objective" in (info.data or {}):
            n = len(info.data["objective"])
            for c in v:
                if len(c.coefficients) != n:
                    raise ValueError(
                        f"Las restricciones deben tener {n} coeficientes para coincidir con la función objetivo"
                    )
        return v


class TableauRow(BaseModel):
    basic_variable: str
    values: list[float]


class GraphPoint(BaseModel):
    x: float
    y: float


class GraphLine(BaseModel):
    a: float
    b: float
    c: float
    points: list[GraphPoint]
    label: str | None = None
    inequality: Literal["<=", ">=", "="] | None = None


class GraphBounds(BaseModel):
    x_min: float
    x_max: float
    y_min: float
    y_max: float


class GraphicalData(BaseModel):
    status: Literal["optimal", "unbounded", "infeasible"]
    bounds: GraphBounds
    constraints: list[GraphLine]
    feasible_polygon: list[GraphPoint] | None = None
    vertices: list[GraphPoint]
    objective_line: GraphLine | None = None
    optimal_point: GraphPoint | None = None
    objective_value: float | None = None
    goal: Literal["max", "min"]


# ─── Binary Integer Programming ──────────────────────────────────────────────

class BinaryRequest(BaseModel):
    objective: list[float] = Field(..., min_length=2, max_length=5)
    goal: Literal["max", "min"]
    constraints: list[Constraint] = Field(..., min_length=1)

    @field_validator("constraints")
    @classmethod
    def same_size(cls, v: list[Constraint], info) -> list[Constraint]:
        if "objective" in (info.data or {}):
            n = len(info.data["objective"])
            for c in v:
                if len(c.coefficients) != n:
                    raise ValueError(
                        f"Las restricciones deben tener {n} coeficientes"
                    )
        return v


class BBNode(BaseModel):
    node_id: int
    parent_id: int | None = None
    depth: int
    fixed_vars: dict[str, int]
    lp_value: float | None = None
    lp_vars: dict[str, float] | None = None
    status: str
    branched_on: str | None = None
    edge_label: str | None = None


class BinaryResponse(BaseModel):
    status: Literal["optimal", "infeasible", "limit"]
    objective_value: float | None = None
    variables: dict[str, int] | None = None
    nodes_explored: int
    nodes: list[BBNode]
    message: str


# ─── Pure Integer Programming ────────────────────────────────────────────────

class IntegerRequest(BaseModel):
    objective: list[float] = Field(..., min_length=2, max_length=5)
    goal: Literal["max", "min"]
    constraints: list[Constraint] = Field(..., min_length=1)

    @field_validator("constraints")
    @classmethod
    def same_size(cls, v: list[Constraint], info) -> list[Constraint]:
        if "objective" in (info.data or {}):
            n = len(info.data["objective"])
            for c in v:
                if len(c.coefficients) != n:
                    raise ValueError(
                        f"Las restricciones deben tener {n} coeficientes"
                    )
        return v


class IntegerNode(BaseModel):
    node_id: int
    parent_id: int | None = None
    depth: int
    lower_bounds: dict[str, float]
    upper_bounds: dict[str, float]
    lp_value: float | None = None
    lp_vars: dict[str, float] | None = None
    status: str
    branched_on: str | None = None
    branch_direction: str | None = None
    edge_label: str | None = None


class IntegerResponse(BaseModel):
    status: Literal["optimal", "infeasible", "limit"]
    objective_value: float | None = None
    variables: dict[str, int] | None = None
    nodes_explored: int
    nodes: list[IntegerNode]
    message: str


# ─── Optimización no restringida de una variable (Bisección) ─────────────────

class BisectionRequest(BaseModel):
    coefficients: list[float] = Field(..., min_length=1, max_length=11)
    goal: Literal["max", "min"]
    a: float
    b: float
    tolerance: float = Field(default=1e-6, gt=0, le=1.0)
    max_iterations: int = Field(default=100, ge=1, le=500)

    @field_validator("coefficients")
    @classmethod
    def not_all_zero(cls, v: list[float]) -> list[float]:
        if all(abs(c) < 1e-12 for c in v):
            raise ValueError("La función no puede ser idénticamente cero")
        return v


class BisectionIteration(BaseModel):
    iteration: int
    a: float
    b: float
    midpoint: float
    f_mid: float
    df_mid: float
    interval_width: float


class BisectionResponse(BaseModel):
    status: Literal["optimal"]
    optimal_x: float | None = None
    optimal_value: float | None = None
    nature: str | None = None
    goal_satisfied: bool
    iterations_count: int
    iterations: list[BisectionIteration]
    function_str: str
    derivative_str: str
    message: str


# ─── Optimización no restringida de una variable (Newton-Raphson) ────────────

class NewtonRequest(BaseModel):
    coefficients: list[float] = Field(..., min_length=1, max_length=11)
    goal: Literal["max", "min"]
    x0: float
    tolerance: float = Field(default=1e-6, gt=0, le=1.0)
    max_iterations: int = Field(default=100, ge=1, le=500)

    @field_validator("coefficients")
    @classmethod
    def not_all_zero(cls, v: list[float]) -> list[float]:
        if all(abs(c) < 1e-12 for c in v):
            raise ValueError("La función no puede ser idénticamente cero")
        return v


class NewtonIteration(BaseModel):
    iteration: int
    x_n: float
    f_xn: float
    df_xn: float
    d2f_xn: float
    x_next: float
    step: float


class NewtonResponse(BaseModel):
    status: Literal["optimal", "no_convergence"]
    optimal_x: float | None = None
    optimal_value: float | None = None
    nature: str | None = None
    goal_satisfied: bool
    iterations_count: int
    iterations: list[NewtonIteration]
    function_str: str
    derivative_str: str
    second_derivative_str: str
    message: str


# ─── Optimización no restringida de varias variables (Método del Gradiente) ──

class GradientRequest(BaseModel):
    expression: str
    variables: list[str] = Field(..., min_length=2, max_length=3)
    x0: list[float] = Field(..., min_length=2, max_length=3)
    goal: Literal["max", "min"]
    step_size: float = Field(default=0.1, gt=0)
    tolerance: float = Field(default=1e-6, gt=0, le=1.0)
    max_iterations: int = Field(default=100, ge=1, le=500)

    @field_validator("x0")
    @classmethod
    def x0_matches_vars(cls, v: list[float], info) -> list[float]:
        if "variables" in (info.data or {}):
            if len(v) != len(info.data["variables"]):
                raise ValueError("x0 debe tener el mismo número de elementos que variables")
        return v


class GradientIteration(BaseModel):
    iteration: int
    point: list[float]
    gradient: list[float]
    gradient_norm: float
    f_value: float


class GradientResponse(BaseModel):
    status: Literal["optimal", "no_convergence"]
    optimal_point: list[float] | None = None
    optimal_value: float | None = None
    gradient_norm: float | None = None
    iterations_count: int
    iterations: list[GradientIteration]
    function_str: str
    gradient_str: list[str]
    variables: list[str]
    message: str


# ─── Optimización no restringida de varias variables (Método Gráfico) ────────

class GraphicalMultivarRequest(BaseModel):
    expression: str
    variables: list[str] = Field(..., min_length=2, max_length=3)
    bounds: list[list[float]] = Field(..., min_length=2, max_length=3)
    goal: Literal["max", "min"]

    @field_validator("bounds")
    @classmethod
    def bounds_valid(cls, v: list[list[float]], info) -> list[list[float]]:
        for b in v:
            if len(b) != 2 or b[1] <= b[0]:
                raise ValueError("Cada rango debe ser [min, max] con max > min")
        if "variables" in (info.data or {}):
            if len(v) != len(info.data["variables"]):
                raise ValueError("bounds debe tener el mismo número de elementos que variables")
        return v


class CriticalPointSchema(BaseModel):
    point: list[float]
    value: float
    nature: Literal["min", "max", "saddle", "degenerate"]


class SurfaceData(BaseModel):
    x: list[float]
    y: list[float]
    z: list[list[float | None]]


class VolumeData(BaseModel):
    x: list[float]
    y: list[float]
    z: list[float]
    value: list[float | None]


class GraphicalMultivarResponse(BaseModel):
    status: Literal["optimal", "no_critical_point"]
    variables: list[str]
    function_str: str
    optimal_point: list[float] | None = None
    optimal_value: float | None = None
    critical_points: list[CriticalPointSchema]
    surface: SurfaceData | None = None
    volume: VolumeData | None = None
    message: str


# ─── Simplex iteration snapshots ─────────────────────────────────────────────

class IterationTableau(BaseModel):
    iteration: int
    entering: str | None = None
    leaving: str | None = None
    tableau_headers: list[str]
    tableau_rows: list[TableauRow]


class SimplexResponse(BaseModel):
    status: Literal["optimal", "unbounded", "infeasible"]
    objective_value: float | None = None
    variables: dict[str, float] | None = None
    iterations: int | None = None
    tableau_headers: list[str] | None = None
    tableau_rows: list[TableauRow] | None = None
    message: str | None = None
    graphical: GraphicalData | None = None
    iteration_tableaux: list[IterationTableau] | None = None
