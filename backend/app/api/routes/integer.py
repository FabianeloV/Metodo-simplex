from fastapi import APIRouter, HTTPException
from app.models.schemas import IntegerRequest, IntegerResponse, IntegerNode
from app.core.integer_engine import IntegerEngine

router = APIRouter(prefix="/integer", tags=["integer"])


@router.post(
    "/solve",
    response_model=IntegerResponse,
    summary="Solve a Pure Integer Programme via Branch & Bound",
)
def solve_integer(payload: IntegerRequest) -> IntegerResponse:
    """
    Accepts an objective function (2-4 variables), an optimisation goal (max/min)
    and a list of linear constraints. All decision variables must be non-negative
    integers. Returns the optimal integer solution and the Branch & Bound tree.
    """
    try:
        engine = IntegerEngine(
            objective=payload.objective,
            goal=payload.goal,
            constraint_coeffs=[c.coefficients for c in payload.constraints],
            inequalities=[c.inequality for c in payload.constraints],
            rhs_values=[c.rhs for c in payload.constraints],
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return IntegerResponse(
        status=result.status,
        objective_value=result.objective_value,
        variables=result.variables,
        nodes_explored=result.nodes_explored,
        nodes=[
            IntegerNode(
                node_id=n.node_id,
                parent_id=n.parent_id,
                depth=n.depth,
                lower_bounds=n.lower_bounds,
                upper_bounds=n.upper_bounds,
                lp_value=n.lp_value,
                lp_vars=n.lp_vars,
                status=n.status,
                branched_on=n.branched_on,
                branch_direction=n.branch_direction,
            )
            for n in result.nodes
        ],
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "integer-optimizer-api"}
