export type ApiErrorCode =
  | "PROMO_NOT_FOUND"
  | "PROMO_EXPIRED"
  | "PROMO_LIMIT_REACHED"
  | "PROMO_ALREADY_ACTIVATED";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;

  constructor(statusCode: number, code: ApiErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
