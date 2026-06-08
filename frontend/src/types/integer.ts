import type { Goal, Inequality } from "./simplex";

export type { Goal, Inequality };

export type IntegerStatus = "optimal" | "infeasible" | "limit";

export type IntegerNodeStatus =
  | "branched"
  | "pruned_bound"
  | "pruned_infeasible"
  | "integer";

export interface IntegerConstraint {
  id: string;
  coefficients: number[];
  inequality: Inequality;
  rhs: number;
}

export interface IntegerRequest {
  objective: number[];
  goal: Goal;
  constraints: Array<{
    coefficients: number[];
    inequality: Inequality;
    rhs: number;
  }>;
}

export interface IntegerNode {
  node_id: number;
  parent_id: number | null;
  depth: number;
  lower_bounds: Record<string, number>;
  upper_bounds: Record<string, number>;
  lp_value: number | null;
  lp_vars: Record<string, number> | null;
  status: IntegerNodeStatus;
  branched_on: string | null;
  branch_direction: "floor" | "ceil" | null;
}

export interface IntegerResponse {
  status: IntegerStatus;
  objective_value: number | null;
  variables: Record<string, number> | null;
  nodes_explored: number;
  nodes: IntegerNode[];
  message: string;
}
