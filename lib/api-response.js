import { NextResponse } from 'next/server';
import { AppError } from './errors/index.js';
import { logger } from './logger.js';

export function successResponse(data = null, statusCode = 200, meta = null) {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status: statusCode });
}

export function createdResponse(data) {
  return successResponse(data, 201);
}

export function paginatedResponse(data, { page, limit, total }) {
  return successResponse(data, 200, {
    page: parseInt(page), limit: parseInt(limit),
    total, totalPages: Math.ceil(total / limit)
  });
}

export function errorResponse(error, request = null) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) logger.error(error.message, { stack: error.stack });
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  logger.error('Erreur inattendue', { message: error.message, stack: error.stack });
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Erreur interne' } },
    { status: 500 }
  );
}
