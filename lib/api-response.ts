import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export function successResponse<T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      statusCode,
    },
    { status: statusCode }
  );
}

export function errorResponse(
  error: string,
  statusCode: number = 400,
  message: string = 'Error'
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message,
      error,
      statusCode,
    },
    { status: statusCode }
  );
}

export function validationError(errors: Record<string, string>): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: 'Validation failed',
      error: JSON.stringify(errors),
      statusCode: 422,
    },
    { status: 422 }
  );
}

export function unauthorizedError(): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: 'Unauthorized',
      error: 'User is not authenticated',
      statusCode: 401,
    },
    { status: 401 }
  );
}

export function forbiddenError(message: string = 'Access denied'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: 'Forbidden',
      error: message,
      statusCode: 403,
    },
    { status: 403 }
  );
}

export function notFoundError(entity: string = 'Resource'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      message: 'Not found',
      error: `${entity} not found`,
      statusCode: 404,
    },
    { status: 404 }
  );
}
