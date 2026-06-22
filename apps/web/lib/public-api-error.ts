export function publicApiError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "AIPM API timed out. The registry host may be offline or starting.";
  }
  if (error instanceof TypeError) {
    return "AIPM API is unreachable. The website can still load, but account and publishing actions need the API online.";
  }
  if (error instanceof Error && error.message) return error.message;
  return "AIPM API is unavailable.";
}
