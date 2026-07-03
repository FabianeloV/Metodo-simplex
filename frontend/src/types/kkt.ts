import type { Goal } from "./simplex";

export type { Goal };

export type KKTInequality = "<=" | ">=" | "=";

export interface KKTConstraint {
  id: string;
  expression: string;
  inequality: KKTInequality;
  rhs: number;
}

export interface KKTConstraintPayload {
  expression: string;
  inequality: KKTInequality;
  rhs: number;
}

export interface KKTRequest {
  expression: string;
  variables: string[];
  goal: Goal;
  constraints: KKTConstraintPayload[];
}

export type KKTCaseStatus = "valid" | "dual_infeasible" | "primal_infeasible" | "no_convergence";

export interface KKTCase {
  case_id: number;
  active_indices: number[];
  status: KKTCaseStatus;
  point: number[] | null;
  lambdas: Record<string, number> | null;
  mus: Record<string, number> | null;
  objective_value: number | null;
  note: string;
}

export interface KKTResponse {
  status: "optimal" | "infeasible";
  variables: string[];
  function_str: string;
  goal: Goal;
  constraints_str: string[];
  optimal_point: number[] | null;
  optimal_value: number | null;
  optimal_case_id: number | null;
  cases: KKTCase[];
  cases_explored: number;
  message: string;
}
