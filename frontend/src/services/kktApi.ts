import type { KKTRequest, KKTResponse } from "../types/kkt";
import { solve } from "./pyodideClient";

export const kktApi = {
  solve: (payload: KKTRequest): Promise<KKTResponse> =>
    solve<KKTResponse>("kkt", payload),
};
