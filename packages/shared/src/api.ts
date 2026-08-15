/**
 * Consistent success/error envelope used by every REST endpoint so the
 * frontend can handle responses uniformly.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
