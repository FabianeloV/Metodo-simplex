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

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphLine {
  a: number;
  b: number;
  c: number;
  points: GraphPoint[];
  label?: string;
  inequality?: Inequality;
}

export interface GraphBounds {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
}

export interface GraphicalData {
  status: SolveStatus;
  bounds: GraphBounds;
  constraints: GraphLine[];
  feasible_polygon?: GraphPoint[] | null;
  vertices: GraphPoint[];
  objective_line?: GraphLine | null;
  optimal_point?: GraphPoint | null;
  objective_value?: number | null;
  goal: Goal;
}

export interface IterationTableau {
  iteration: number;
  entering?: string | null;
  leaving?: string | null;
  tableau_headers: string[];
  tableau_rows: TableauRow[];
}

export interface SimplexResponse {
  status: SolveStatus;
  objective_value?: number;
  variables?: Record<string, number>;
  iterations?: number;
  tableau_headers?: string[];
  tableau_rows?: TableauRow[];
  message?: string;
  graphical?: GraphicalData | null;
  iteration_tableaux?: IterationTableau[] | null;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export interface SolverState {
  nVars: VariableCount;
  objective: ObjectiveFunction;
  constraints: Constraint[];
}
