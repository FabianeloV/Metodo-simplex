import type { Goal } from "./simplex";

export type { Goal };

export interface GradientRequest {
  expression: string;
  variables: string[];
  x0: number[];
  goal: Goal;
  step_size: number;
  tolerance: number;
  max_iterations: number;
}

export interface GradientIteration {
  iteration: number;
  point: number[];
  gradient: number[];
  gradient_norm: number;
  f_value: number;
}

export interface GradientResponse {
  status: "optimal" | "no_convergence";
  optimal_point: number[] | null;
  optimal_value: number | null;
  gradient_norm: number | null;
  iterations_count: number;
  iterations: GradientIteration[];
  function_str: string;
  gradient_str: string[];
  variables: string[];
  message: string;
}
