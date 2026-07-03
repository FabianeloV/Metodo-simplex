from fastapi import APIRouter, HTTPException
from app.models.schemas import KKTRequest, KKTResponse, KKTCase
from app.core.kkt_engine import KKTEngine

router = APIRouter(prefix="/kkt", tags=["kkt"])


@router.post(
    "/solve",
    response_model=KKTResponse,
    summary="Optimizar una función no lineal con restricciones mediante KKT",
)
def solve_kkt(payload: KKTRequest) -> KKTResponse:
    """
    Enumera cada combinación de restricciones de desigualdad activas y
    resuelve el sistema KKT correspondiente por Newton multivariable,
    reportando todos los casos explorados y el óptimo entre los válidos.
    """
    try:
        engine = KKTEngine(
            expression=payload.expression,
            variables=payload.variables,
            goal=payload.goal,
            constraints=[c.model_dump() for c in payload.constraints],
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return KKTResponse(
        status=result.status,
        variables=result.variables,
        function_str=result.function_str,
        goal=result.goal,
        constraints_str=result.constraints_str,
        optimal_point=result.optimal_point,
        optimal_value=result.optimal_value,
        optimal_case_id=result.optimal_case_id,
        cases=[
            KKTCase(
                case_id=c.case_id,
                active_indices=c.active_indices,
                status=c.status,
                point=c.point,
                lambdas=c.lambdas,
                mus=c.mus,
                objective_value=c.objective_value,
                note=c.note,
            )
            for c in result.cases
        ],
        cases_explored=result.cases_explored,
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "kkt-optimizer-api"}
