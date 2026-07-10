import type { NewtonRequest, NewtonResponse } from "../types/newton";
import { solve } from "./pyodideClient";

export const newtonApi = {
  solve: (payload: NewtonRequest): Promise<NewtonResponse> =>
    solve<NewtonResponse>("newton", payload),
};
