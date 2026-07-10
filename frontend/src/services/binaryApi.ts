import type { BinaryRequest, BinaryResponse } from "../types/binary";
import { solve } from "./pyodideClient";

export const binaryApi = {
  solve: (payload: BinaryRequest): Promise<BinaryResponse> =>
    solve<BinaryResponse>("binary", payload),
};
