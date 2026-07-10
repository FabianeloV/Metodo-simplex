import type { GradientRequest, GradientResponse } from "../types/gradient";
import { solve } from "./pyodideClient";

export const gradientApi = {
  solve: (payload: GradientRequest): Promise<GradientResponse> =>
    solve<GradientResponse>("gradient", payload),
};
