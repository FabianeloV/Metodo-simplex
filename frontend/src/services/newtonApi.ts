import type { NewtonRequest, NewtonResponse } from "../types/newton";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
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

export const newtonApi = {
  solve: (payload: NewtonRequest): Promise<NewtonResponse> =>
    post<NewtonRequest, NewtonResponse>("/newton/solve", payload),
};
