from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.simplex import router as simplex_router

app = FastAPI(
    title="Simplex Optimizer API",
    description="REST API for solving Linear Programming problems using the Simplex Method.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simplex_router, prefix="/api/v1")


@app.get("/", tags=["root"])
def root() -> dict:
    return {"message": "Simplex Optimizer API", "docs": "/docs"}
