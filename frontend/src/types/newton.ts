import type { Goal } from "./simplex";

export type { Goal };

export interface NewtonRequest {
  coefficients: number[];
  goal: Goal;
  x0: number;
  tolerance: number;
  max_iterations: number;
}

export interface NewtonIteration {
  iteration: number;
  x_n: number;
  f_xn: number;
  df_xn: number;
  d2f_xn: number;
  x_next: number;
  step: number;
}

export interface NewtonResponse {
  status: "optimal" | "no_convergence";
  optimal_x: number | null;
  optimal_value: number | null;
  nature: string | null;
  goal_satisfied: boolean;
  iterations_count: number;
  iterations: NewtonIteration[];
  function_str: string;
  derivative_str: string;
  second_derivative_str: string;
  message: string;
}
