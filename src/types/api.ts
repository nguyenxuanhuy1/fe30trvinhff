interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export type { ApiResponse, ApiErrorResponse, PaginatedResponse };
