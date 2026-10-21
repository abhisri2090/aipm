/** Thrown when the registry could not be read (network error, timeout, 429, 5xx). */
export class RegistryUnavailableError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "RegistryUnavailableError";
    this.status = status;
  }
}

export function isRegistryNotFound(status: number): boolean {
  return status === 400 || status === 404 || status === 410;
}
