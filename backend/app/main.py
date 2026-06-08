from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.simplex import router as simplex_router
from app.api.routes.binary import router as binary_router
from app.api.routes.integer import router as integer_router

app = FastAPI(
    title="API de Optimización",
    description="API REST para resolver Programación Lineal (Simplex) y Programación Entera Binaria (Branch & Bound).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://fabianelov.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simplex_router, prefix="/api/v1")
app.include_router(binary_router, prefix="/api/v1")
app.include_router(integer_router, prefix="/api/v1")


@app.get("/", tags=["root"])
def root() -> dict:
    return {"message": "Optimización Simplex API", "docs": "/docs"}
