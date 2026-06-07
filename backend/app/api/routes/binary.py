from fastapi import APIRouter, HTTPException
from app.models.schemas import BinaryRequest, BinaryResponse, BBNode
from app.core.binary_engine import BinaryEngine

router = APIRouter(prefix="/binary", tags=["binary"])


@router.post(
    "/solve",
    response_model=BinaryResponse,
    summary="Solve a Binary Integer Programme via Branch & Bound",
)
def solve_binary(payload: BinaryRequest) -> BinaryResponse:
    """
    Accepts an objective function (2-4 binary variables), an optimisation goal
    (max/min) and a list of linear constraints. Returns the optimal 0/1 solution
    together with the full Branch & Bound exploration tree.
    """
    try:
        engine = BinaryEngine(
            objective=payload.objective,
            goal=payload.goal,
            constraint_coeffs=[c.coefficients for c in payload.constraints],
            inequalities=[c.inequality for c in payload.constraints],
            rhs_values=[c.rhs for c in payload.constraints],
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return BinaryResponse(
        status=result.status,
        objective_value=result.objective_value,
        variables=result.variables,
        nodes_explored=result.nodes_explored,
        nodes=[
            BBNode(
                node_id=n.node_id,
                parent_id=n.parent_id,
                depth=n.depth,
                fixed_vars=n.fixed_vars,
                lp_value=n.lp_value,
                lp_vars=n.lp_vars,
                status=n.status,
                branched_on=n.branched_on,
            )
            for n in result.nodes
        ],
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "binary-optimizer-api"}
