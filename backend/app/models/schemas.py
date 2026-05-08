from pydantic import BaseModel, Field, field_validator
from typing import Literal


class Constraint(BaseModel):
    coefficients: list[float] = Field(..., min_length=2, max_length=4)
    inequality: Literal["<=", ">=", "="]
    rhs: float

    @field_validator("coefficients")
    @classmethod
    def check_length(cls, v: list[float]) -> list[float]:
        if not (2 <= len(v) <= 4):
            raise ValueError("coefficients must have between 2 and 4 elements")
        return v


class SimplexRequest(BaseModel):
    objective: list[float] = Field(..., min_length=2, max_length=4)
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
                        f"All constraints must have {n} coefficients to match the objective function"
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


class SimplexResponse(BaseModel):
    status: Literal["optimal", "unbounded", "infeasible"]
    objective_value: float | None = None
    variables: dict[str, float] | None = None
    iterations: int | None = None
    tableau_headers: list[str] | None = None
    tableau_rows: list[TableauRow] | None = None
    message: str | None = None
    graphical: GraphicalData | None = None
