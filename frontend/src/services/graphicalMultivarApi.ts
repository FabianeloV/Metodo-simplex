import type { GraphicalMultivarRequest, GraphicalMultivarResponse } from "../types/graphicalMultivar";
import { solve } from "./pyodideClient";

export const graphicalMultivarApi = {
  solve: (payload: GraphicalMultivarRequest): Promise<GraphicalMultivarResponse> =>
    solve<GraphicalMultivarResponse>("graphical", payload),
};
