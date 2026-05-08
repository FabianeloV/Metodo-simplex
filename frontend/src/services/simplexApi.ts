import type { SimplexRequest, SimplexResponse } from "../types/simplex";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<TBody, TResponse>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((d: { detail?: string }) => d.detail ?? response.statusText)
      .catch(() => response.statusText);
    throw new ApiError(response.status, String(detail));
  }

  return response.json() as Promise<TResponse>;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const simplexApi = {
  solve: (payload: SimplexRequest): Promise<SimplexResponse> =>
    post<SimplexRequest, SimplexResponse>("/simplex/solve", payload),
};
