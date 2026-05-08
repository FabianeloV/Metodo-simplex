from fastapi import APIRouter, HTTPException
from app.models.schemas import SimplexRequest, SimplexResponse, TableauRow
from app.core.simplex_engine import SimplexEngine

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
        )

    return SimplexResponse(status=result.status, message=result.message)


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "simplex-optimizer-api"}
