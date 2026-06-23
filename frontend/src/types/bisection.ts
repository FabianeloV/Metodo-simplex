import type { Goal } from "./simplex";

export type { Goal };

export interface BisectionRequest {
  coefficients: number[];
  goal: Goal;
  a: number;
  b: number;
  tolerance: number;
  max_iterations: number;
}

export interface BisectionIteration {
  iteration: number;
  a: number;
  b: number;
  midpoint: number;
  f_mid: number;
  df_mid: number;
  interval_width: number;
}

export interface BisectionResponse {
  status: "optimal";
  optimal_x: number | null;
  optimal_value: number | null;
  nature: string | null;
  goal_satisfied: boolean;
  iterations_count: number;
  iterations: BisectionIteration[];
  function_str: string;
  derivative_str: string;
  message: string;
}
