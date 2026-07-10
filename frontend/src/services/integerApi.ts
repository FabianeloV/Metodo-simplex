import type { IntegerRequest, IntegerResponse } from "../types/integer";
import { solve } from "./pyodideClient";

export const integerApi = {
  solve: (payload: IntegerRequest): Promise<IntegerResponse> =>
    solve<IntegerResponse>("integer", payload),
};
