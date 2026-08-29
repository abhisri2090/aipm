import { publicApiError } from "./public-api-error";
import { showErrorToast } from "./toast";

export type ApiOptions = {
  timeoutMs?: number;
  silent?: boolean;
};

export async function api<T>(path: string, init?: RequestInit, options?: ApiOptions): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options?.timeoutMs ?? 6000);
  let apiMessage: string | null = null;

  try {
    const hasBody = init?.body != null && init.body !== "";
    const response = await fetch(path, {
      ...init,
      credentials: "include",
      signal: init?.signal ?? controller.signal,
      headers: {
        ...(hasBody ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { error?: string };
      apiMessage = response.status === 401 ? "Login required" : (error.error ?? `Request failed: ${response.status}`);
      throw new Error(apiMessage);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (error) {
    const message = apiMessage ?? publicApiError(error);
    if (!options?.silent) showErrorToast(message);
    throw error instanceof Error ? error : new Error(message);
  } finally {
    window.clearTimeout(timeout);
  }
}
