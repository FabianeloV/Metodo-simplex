from fastapi import APIRouter, HTTPException
from app.models.schemas import SimplexRequest, SimplexResponse, TableauRow, IterationTableau
from app.core.simplex_engine import SimplexEngine
from app.core.graphical_method import build_graphical_data

router = APIRouter(prefix="/simplex", tags=["simplex"])


@router.post("/solve", response_model=SimplexResponse, summary="Solve a linear programme via the Simplex method")
def solve(payload: SimplexRequest) -> SimplexResponse:
    """
    Accepts an objective function (2-4 variables), an optimisation goal
    (max/min) and a list of linear constraints, then returns the optimal
    solution together with the final simplex tableau.
    """
    try:
        engine = SimplexEngine(
            objective=payload.objective,
            goal=payload.goal,
            constraint_coeffs=[c.coefficients for c in payload.constraints],
            inequalities=[c.inequality for c in payload.constraints],
            rhs_values=[c.rhs for c in payload.constraints],
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    graphical = None
    if len(payload.objective) == 2:
        optimal_point = None
        if result.status == "optimal" and result.variables is not None:
            optimal_point = {
                "x": result.variables.get("x1", 0.0),
                "y": result.variables.get("x2", 0.0),
            }
        graphical = build_graphical_data(
            objective=payload.objective,
            goal=payload.goal,
            constraint_coeffs=[c.coefficients for c in payload.constraints],
            inequalities=[c.inequality for c in payload.constraints],
            rhs_values=[c.rhs for c in payload.constraints],
            status=result.status,
            optimal_point=optimal_point,
            objective_value=result.objective_value,
        )

    def _build_iteration_tableaux(snapshots: list[dict]) -> list[IterationTableau]:
        return [
            IterationTableau(
                iteration=s["iteration"],
                entering=s.get("entering"),
                leaving=s.get("leaving"),
                tableau_headers=s["tableau_headers"],
                tableau_rows=[
                    TableauRow(basic_variable=r["basic_variable"], values=r["values"])
                    for r in s["tableau_rows"]
                ],
            )
            for s in snapshots
        ]

    if result.status == "optimal":
        return SimplexResponse(
            status="optimal",
            objective_value=result.objective_value,
            variables=result.variables,
            iterations=result.iterations,
            tableau_headers=result.tableau_headers,
            tableau_rows=[
                TableauRow(basic_variable=r["basic_variable"], values=r["values"])
                for r in result.tableau_rows
            ],
            message=result.message,
            graphical=graphical,
            iteration_tableaux=_build_iteration_tableaux(result.iteration_tableaux),
        )

    return SimplexResponse(
        status=result.status,
        message=result.message,
        graphical=graphical,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "simplex-optimizer-api"}
