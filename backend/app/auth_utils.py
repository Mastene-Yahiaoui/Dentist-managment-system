# Authentication utilities and decorators for JWT-based authentication.
# Provides helpers for token verification, permission checking, and user extraction.

import logging
import jwt
from functools import wraps
from typing import Dict, Optional, Callable, Any
from django.conf import settings
from django.http import JsonResponse
from rest_framework import status
from rest_framework.request import Request
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

logger = logging.getLogger(__name__)


class AuthUtilsError(Exception):
    """Base exception for auth utilities"""
    pass


class InvalidTokenError(AuthUtilsError):
    """Raised when token is invalid or expired"""
    pass


class MissingTokenError(AuthUtilsError):
    """Raised when token is missing"""
    pass


class InsufficientPermissionsError(AuthUtilsError):
    """Raised when user lacks required permissions"""
    pass


def extract_token_from_request(request: Request) -> Optional[str]:
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')

    if not auth_header:
        return None

    try:
        auth_type, token = auth_header.split()
        if auth_type.lower() != 'bearer':
            raise MissingTokenError("Invalid authorization header format")
        return token
    except ValueError:
        raise MissingTokenError("Invalid authorization header format")


def verify_token(token: str) -> Dict[str, Any]:
   
    try:
        payload = jwt.decode(
            token,
            settings.SIMPLE_JWT['SIGNING_KEY'],
            algorithms=['HS256'],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise InvalidTokenError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")


def get_user_from_token(request: Request) -> Dict[str, Any]:

    token = extract_token_from_request(request)
    if not token:
        raise MissingTokenError("Authorization token not provided")

    payload = verify_token(token)

    return {
        'user_id': payload.get('user_id'),
        'email': payload.get('email'),
        'token': token,
        'payload': payload,
    }


def require_auth(view_func: Callable) -> Callable:

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            user_info = get_user_from_token(request)
            request.user_id = user_info['user_id']
            request.user_email = user_info['email']
            request.auth_payload = user_info['payload']
            return view_func(request, *args, **kwargs)
        except MissingTokenError:
            return JsonResponse(
                {'error': 'Authorization token not provided'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except InvalidTokenError as e:
            return JsonResponse(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return JsonResponse(
                {'error': 'Authentication failed'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
    return wrapper


def require_permission(permission: str) -> Callable:

    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                user_info = get_user_from_token(request)
                request.user_id = user_info['user_id']
                request.user_email = user_info['email']
                request.auth_payload = user_info['payload']

                # Check permission in payload
                user_role = user_info['payload'].get('role', 'user')
                if user_role != permission and user_role != 'admin':
                    return JsonResponse(
                        {'error': 'Insufficient permissions'},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                return view_func(request, *args, **kwargs)
            except MissingTokenError:
                return JsonResponse(
                    {'error': 'Authorization token not provided'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            except InvalidTokenError as e:
                return JsonResponse(
                    {'error': str(e)},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            except Exception as e:
                logger.error(f"Authorization error: {e}")
                return JsonResponse(
                    {'error': 'Authorization failed'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        return wrapper
    return decorator


def check_permission(payload: Dict[str, Any], required_role: str) -> bool:
    user_role = payload.get('role', 'user')
    if user_role == 'admin':
        return True
    return user_role == required_role


def get_user_id_from_request(request: Request) -> Optional[str]:

    try:
        user_info = get_user_from_token(request)
        return user_info['user_id']
    except (MissingTokenError, InvalidTokenError):
        return None


def get_user_email_from_request(request: Request) -> Optional[str]:

    try:
        user_info = get_user_from_token(request)
        return user_info['email']
    except (MissingTokenError, InvalidTokenError):
        return None


def get_user_role_from_request(request: Request) -> str:

    try:
        user_info = get_user_from_token(request)
        return user_info['payload'].get('role', 'user')
    except (MissingTokenError, InvalidTokenError):
        return 'guest'


def create_error_response(
    message: str,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    error_code: str = None,
    details: Dict = None,
) -> JsonResponse:

    response_data = {
        'error': message,
        'status': status_code,
    }

    if error_code:
        response_data['error_code'] = error_code

    if details:
        response_data['details'] = details

    return JsonResponse(response_data, status=status_code)


def create_success_response(
    data: Any = None,
    message: str = None,
    status_code: int = status.HTTP_200_OK,
) -> JsonResponse:

    response_data = {
        'status': status_code,
        'success': True,
    }

    if message:
        response_data['message'] = message

    if data:
        response_data['data'] = data

    return JsonResponse(response_data, status=status_code)


def is_authenticated(request: Request) -> bool:

    try:
        get_user_from_token(request)
        return True
    except (MissingTokenError, InvalidTokenError):
        return False


def is_admin(request: Request) -> bool:

    try:
        user_info = get_user_from_token(request)
        return user_info['payload'].get('role') == 'admin'
    except (MissingTokenError, InvalidTokenError):
        return False


def is_staff(request: Request) -> bool:

    try:
        user_info = get_user_from_token(request)
        role = user_info['payload'].get('role')
        return role in ['admin', 'staff']
    except (MissingTokenError, InvalidTokenError):
        return False
