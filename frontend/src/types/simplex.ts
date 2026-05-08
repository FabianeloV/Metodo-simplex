// ─── Domain types ────────────────────────────────────────────────────────────

export type Goal = "max" | "min";
export type Inequality = "<=" | ">=" | "=";
export type VariableCount = 2 | 3 | 4;
export type SolveStatus = "optimal" | "unbounded" | "infeasible";

export interface Constraint {
  id: string;
  coefficients: number[];
  inequality: Inequality;
  rhs: number;
}

export interface ObjectiveFunction {
  coefficients: number[];
  goal: Goal;
}

// ─── API request / response ───────────────────────────────────────────────────

export interface SimplexRequest {
  objective: number[];
  goal: Goal;
  constraints: Array<{
    coefficients: number[];
    inequality: Inequality;
    rhs: number;
  }>;
}

export interface TableauRow {
  basic_variable: string;
  values: number[];
}

export interface SimplexResponse {
  status: SolveStatus;
  objective_value?: number;
  variables?: Record<string, number>;
  iterations?: number;
  tableau_headers?: string[];
  tableau_rows?: TableauRow[];
  message?: string;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export interface SolverState {
  nVars: VariableCount;
  objective: ObjectiveFunction;
  constraints: Constraint[];
}
