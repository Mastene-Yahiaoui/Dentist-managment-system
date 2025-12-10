import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError

from .supabase_service import (
    SupabaseServiceError,
    SupabaseDatabaseError,
    SupabaseConnectionError,
    SupabaseDocumentNotFoundError,
)

logger = logging.getLogger(__name__)


class SupabaseEnabledViewSetMixin:

    # Supabase is always enabled
    supabase_enabled = True
    
    def get_queryset(self):
        if hasattr(self, 'queryset') and self.queryset is not None:
            return self.queryset.none()
        return None


def handle_supabase_exception(exception):
    error_message = str(exception)
    
    logger.error(f"API exception: {type(exception).__name__}: {error_message}", exc_info=True)
    
    # Handle DRF validation errors - these should return 400
    if isinstance(exception, DRFValidationError):
        logger.warning(f"Validation error: {exception.detail}")
        return Response(
            {
                'error': 'Validation error',
                'detail': exception.detail,
                'error_code': 'VALIDATION_ERROR',
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle Supabase document not found errors - 404
    if isinstance(exception, SupabaseDocumentNotFoundError):
        return Response(
            {
                'error': 'Resource not found',
                'detail': error_message,
                'error_code': 'NOT_FOUND',
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle Supabase database errors - configuration issue - 503
    if isinstance(exception, SupabaseDatabaseError):
        logger.error(f"Supabase database error: {error_message}")
        return Response(
            {
                'error': 'Database configuration error. Please contact administrator.',
                'detail': 'Supabase database is not configured or does not exist.',
                'error_code': 'DATABASE_NOT_CONFIGURED',
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Handle Supabase connection errors - 503
    if isinstance(exception, SupabaseConnectionError):
        logger.error(f"Supabase connection error: {error_message}")
        return Response(
            {
                'error': 'Unable to connect to database. Please try again later.',
                'detail': 'Connection to Supabase failed.',
                'error_code': 'DATABASE_CONNECTION_ERROR',
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Handle general Supabase service errors - 503
    if isinstance(exception, SupabaseServiceError):
        logger.error(f"Supabase service error: {error_message}")
        return Response(
            {
                'error': 'Database service error. Please try again later.',
                'detail': error_message,
                'error_code': 'DATABASE_SERVICE_ERROR',
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    # Handle ValueError - usually validation issues - 400
    if isinstance(exception, ValueError):
        logger.warning(f"Value error: {error_message}")
        return Response(
            {
                'error': 'Invalid value provided',
                'detail': error_message,
                'error_code': 'INVALID_VALUE',
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle TypeError - usually missing required data - 400
    if isinstance(exception, TypeError):
        logger.warning(f"Type error: {error_message}")
        return Response(
            {
                'error': 'Invalid data format',
                'detail': error_message,
                'error_code': 'INVALID_DATA_FORMAT',
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle KeyError - missing required field - 400
    if isinstance(exception, KeyError):
        logger.warning(f"Key error: {error_message}")
        return Response(
            {
                'error': 'Missing required field',
                'detail': f'Required field missing: {error_message}',
                'error_code': 'MISSING_FIELD',
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # For all other exceptions, return 500 with a generic message
    # In production (DEBUG=False), don't expose internal error details
    from django.conf import settings
    
    if settings.DEBUG:
        return Response(
            {
                'error': 'An unexpected error occurred',
                'detail': error_message,
                'error_code': 'INTERNAL_ERROR',
                'exception_type': type(exception).__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    else:
        # In production, log the error but return a generic message
        logger.error(
            f'Unexpected error ({type(exception).__name__}): {error_message}',
            exc_info=True
        )
        return Response(
            {
                'error': 'An unexpected error occurred. Please try again later.',
                'error_code': 'INTERNAL_ERROR',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def handle_supabase_error(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return handle_supabase_exception(e)
    return wrapper


def create_success_response(data, message=None, status_code=status.HTTP_200_OK):
    response_data = {'data': data}
    if message:
        response_data['message'] = message
    return Response(response_data, status=status_code)


def create_list_response(results, count=None):
    return Response({
        'count': count if count is not None else len(results),
        'results': results
    })
