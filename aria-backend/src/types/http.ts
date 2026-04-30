/** Error HTTP con `status` para que el middleware lo traduzca al cliente. */
export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}
