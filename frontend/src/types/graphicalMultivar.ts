import type { Goal } from "./simplex";

export type { Goal };

export interface GraphicalMultivarRequest {
  expression: string;
  variables: string[];
  bounds: number[][];
  goal: Goal;
}

export type CriticalPointNature = "min" | "max" | "saddle" | "degenerate";

export interface CriticalPoint {
  point: number[];
  value: number;
  nature: CriticalPointNature;
}

export interface SurfaceData {
  x: number[];
  y: number[];
  z: (number | null)[][];
}

export interface VolumeData {
  x: number[];
  y: number[];
  z: number[];
  value: (number | null)[];
}

export interface GraphicalMultivarResponse {
  status: "optimal" | "no_critical_point";
  variables: string[];
  function_str: string;
  optimal_point: number[] | null;
  optimal_value: number | null;
  critical_points: CriticalPoint[];
  surface: SurfaceData | null;
  volume: VolumeData | null;
  message: string;
}
