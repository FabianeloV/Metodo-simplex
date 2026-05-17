from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.simplex import router as simplex_router

app = FastAPI(
    title="API de Optimización Simplex",
    description="API REST para resolver problemas de Programación Lineal usando el Método Simplex.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://FabianeloV.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simplex_router, prefix="/api/v1")


@app.get("/", tags=["root"])
def root() -> dict:
    return {"message": "Optimización Simplex API", "docs": "/docs"}
