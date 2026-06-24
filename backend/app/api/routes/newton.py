from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    NewtonRequest,
    NewtonResponse,
    NewtonIteration as NewtonIterationSchema,
)
from app.core.newton_engine import NewtonEngine

router = APIRouter(prefix="/newton", tags=["newton"])


@router.post(
    "/solve",
    response_model=NewtonResponse,
    summary="Optimizar una función de una variable por el método de Newton-Raphson",
)
def solve_newton(payload: NewtonRequest) -> NewtonResponse:
    """
    Acepta un polinomio de una variable (de cualquier grado) dado por sus
    coeficientes de mayor a menor grado, una meta de optimización (max/min) y un
    punto inicial x₀. Devuelve el punto óptimo encontrado por Newton-Raphson
    junto con la tabla completa de iteraciones.
    """
    try:
        engine = NewtonEngine(
            coefficients=payload.coefficients,
            goal=payload.goal,
            x0=payload.x0,
            tolerance=payload.tolerance,
            max_iterations=payload.max_iterations,
        )
        result = engine.solve()
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return NewtonResponse(
        status=result.status,
        optimal_x=result.optimal_x,
        optimal_value=result.optimal_value,
        nature=result.nature,
        goal_satisfied=result.goal_satisfied,
        iterations_count=result.iterations_count,
        iterations=[
            NewtonIterationSchema(
                iteration=it.iteration,
                x_n=it.x_n,
                f_xn=it.f_xn,
                df_xn=it.df_xn,
                d2f_xn=it.d2f_xn,
                x_next=it.x_next,
                step=it.step,
            )
            for it in result.iterations
        ],
        function_str=result.function_str,
        derivative_str=result.derivative_str,
        second_derivative_str=result.second_derivative_str,
        message=result.message,
    )


@router.get("/health", summary="Health check")
def health() -> dict:
    return {"status": "ok", "service": "newton-optimizer-api"}
