from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    GradientRequest,
    GradientResponse,
    GradientIteration as GradientIterationSchema,
)
from app.core.gradient_engine import GradientEngine

router = APIRouter(prefix="/gradient", tags=["gradient"])


@router.post(
    "/solve",
    response_model=GradientResponse,
    summary="Optimizar una función de varias variables por el método del gradiente",
)
def solve_gradient(payload: GradientRequest) -> GradientResponse:
    """
    Acepta una expresión simbólica de 2 o 3 variables, un punto inicial y un tamaño
    de paso. Devuelve el óptimo encontrado por descenso/ascenso de gradiente junto
    con la tabla completa de iteraciones.
    """
    try:
        engine = GradientEngine(
            expression=payload.expression,
            variables=payload.variables,
            x0=payload.x0,
            goal=payload.goal,
            step_size=payload.step_size,
            tolerance=payload.tolerance,
            max_iterations=payload.max_iterations,
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return GradientResponse(
        status=result.status,
        optimal_point=result.optimal_point,
        optimal_value=result.optimal_value,
        gradient_norm=result.gradient_norm,
        iterations_count=result.iterations_count,
        iterations=[
            GradientIterationSchema(
                iteration=it.iteration,
                point=it.point,
                gradient=it.gradient,
                gradient_norm=it.gradient_norm,
                f_value=it.f_value,
            )
            for it in result.iterations
        ],
        function_str=result.function_str,
        gradient_str=result.gradient_str,
        variables=result.variables,
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "gradient-optimizer-api"}
