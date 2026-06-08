import type { Goal, Inequality } from "./simplex";

export type { Goal, Inequality };

export type BinaryStatus = "optimal" | "infeasible" | "limit";

export type BBNodeStatus =
  | "branched"
  | "pruned_bound"
  | "pruned_infeasible"
  | "integer";

export interface BinaryConstraint {
  id: string;
  coefficients: number[];
  inequality: Inequality;
  rhs: number;
}

export interface BinaryRequest {
  objective: number[];
  goal: Goal;
  constraints: Array<{
    coefficients: number[];
    inequality: Inequality;
    rhs: number;
  }>;
}

export interface BBNode {
  node_id: number;
  parent_id: number | null;
  depth: number;
  fixed_vars: Record<string, number>;
  lp_value: number | null;
  lp_vars: Record<string, number> | null;
  status: BBNodeStatus;
  branched_on: string | null;
  edge_label: string | null;
}

export interface BinaryResponse {
  status: BinaryStatus;
  objective_value: number | null;
  variables: Record<string, number> | null;
  nodes_explored: number;
  nodes: BBNode[];
  message: string;
}
