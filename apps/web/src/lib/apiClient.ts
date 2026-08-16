import type { ApiResult } from "@telemetry/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

/**
 * The only place the frontend talks to the backend. Every call goes
 * through here so error handling, the base URL, and auth headers are
 * defined exactly once — no component duplicates this logic.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const json = (await response.json().catch(() => null)) as ApiResult<T> | null;

  if (!json || !json.success) {
    const message = json && "error" in json ? json.error.message : "Something went wrong.";
    const code = json && "error" in json ? json.error.code : "UNKNOWN_ERROR";
    throw new ApiError(message, response.status, code);
  }

  return json.data;
}
