import type { SimplexRequest, SimplexResponse } from "../types/simplex";
import { solve } from "./pyodideClient";

export const simplexApi = {
  solve: (payload: SimplexRequest): Promise<SimplexResponse> =>
    solve<SimplexResponse>("simplex", payload),
};
