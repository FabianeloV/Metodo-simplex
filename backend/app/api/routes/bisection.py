from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    BisectionRequest,
    BisectionResponse,
    BisectionIteration,
)
from app.core.bisection_engine import BisectionEngine

router = APIRouter(prefix="/bisection", tags=["bisection"])


@router.post(
    "/solve",
    response_model=BisectionResponse,
    summary="Optimizar una función de una variable por el método de bisección",
)
def solve_bisection(payload: BisectionRequest) -> BisectionResponse:
    """
    Acepta un polinomio de una variable (de cualquier grado) dado por sus
    coeficientes de mayor a menor grado, una meta de optimización (max/min) y un
    intervalo [a, b]. Devuelve el punto óptimo (raíz de f'(x)) junto con la tabla
    completa de iteraciones del método de bisección.
    """
    try:
        engine = BisectionEngine(
            coefficients=payload.coefficients,
            goal=payload.goal,
            a=payload.a,
            b=payload.b,
            tolerance=payload.tolerance,
            max_iterations=payload.max_iterations,
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return BisectionResponse(
        status=result.status,
        optimal_x=result.optimal_x,
        optimal_value=result.optimal_value,
        nature=result.nature,
        goal_satisfied=result.goal_satisfied,
        iterations_count=result.iterations_count,
        iterations=[
            BisectionIteration(
                iteration=it.iteration,
                a=it.a,
                b=it.b,
                midpoint=it.midpoint,
                f_mid=it.f_mid,
                df_mid=it.df_mid,
                interval_width=it.interval_width,
            )
            for it in result.iterations
        ],
        function_str=result.function_str,
        derivative_str=result.derivative_str,
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "bisection-optimizer-api"}
