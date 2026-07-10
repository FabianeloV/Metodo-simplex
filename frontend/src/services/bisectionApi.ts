import type { BisectionRequest, BisectionResponse } from "../types/bisection";
import { solve } from "./pyodideClient";

export const bisectionApi = {
  solve: (payload: BisectionRequest): Promise<BisectionResponse> =>
    solve<BisectionResponse>("bisection", payload),
};
