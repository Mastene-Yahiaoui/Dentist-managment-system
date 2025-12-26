# Authentication ViewSet for REST API endpoints.
# Provides signup, login, token refresh, and profile management endpoints.

import logging
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from app.supabase_service.auth import (
    get_auth_service,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    UserNotFoundError,
    TokenRefreshError,
    AuthServiceError,
)
from app.auth_utils import (
    get_user_from_token,
    MissingTokenError,
    InvalidTokenError,
    create_error_response,
    create_success_response,
)

logger = logging.getLogger(__name__)


class AuthViewSet(viewsets.ViewSet):
    # ViewSet for authentication operations.
    
    # Endpoints:
    # - POST /api/auth/signup/ - Register new user
    # - POST /api/auth/login/ - Login user
    # - POST /api/auth/refresh/ - Refresh access token
    # - POST /api/auth/password-reset/ - Request password reset
    # - POST /api/auth/password-reset-confirm/ - Confirm password reset
    # - POST /api/auth/change-password/ - Change password (authenticated users)
    # - POST /api/auth/logout/ - Logout user

    def get_permissions(self):
  
        if self.action in ['signup', 'login', 'password_reset', 'password_reset_confirm']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def signup(self, request):

        try:
            email = request.data.get('email')
            password = request.data.get('password')
            full_name = request.data.get('full_name', '')

            # Validation
            if not email or not password:
                return create_error_response(
                    'Email and password are required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_FIELDS',
                )

            if len(password) < 6:
                return create_error_response(
                    'Password must be at least 6 characters',
                    status.HTTP_400_BAD_REQUEST,
                    'PASSWORD_TOO_SHORT',
                )

            # Sign up
            auth_service = get_auth_service()
            user_data = auth_service.signup(
                email=email,
                password=password,
                full_name=full_name,
            )

            logger.info(f"User signed up: {email}")
            return create_success_response(
                data=user_data,
                message='User registered successfully',
                status_code=status.HTTP_201_CREATED,
            )

        except UserAlreadyExistsError:
            return create_error_response(
                'User with this email already exists',
                status.HTTP_409_CONFLICT,
                'USER_EXISTS',
            )
        except AuthServiceError as e:
            logger.error(f"Signup error: {e}")
            return create_error_response(
                str(e),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'SIGNUP_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error during signup: {e}")
            return create_error_response(
                'An unexpected error occurred',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
       
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            # Validation
            if not email or not password:
                return create_error_response(
                    'Email and password are required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_FIELDS',
                )

            # Login
            auth_service = get_auth_service()
            user_data = auth_service.login(email=email, password=password)

            logger.info(f"User logged in: {email}")
            return create_success_response(
                data=user_data,
                message='Login successful',
                status_code=status.HTTP_200_OK,
            )

        except InvalidCredentialsError:
            return create_error_response(
                'Invalid email or password',
                status.HTTP_401_UNAUTHORIZED,
                'INVALID_CREDENTIALS',
            )
        except AuthServiceError as e:
            logger.error(f"Login error: {e}")
            return create_error_response(
                str(e),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'LOGIN_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error during login: {e}")
            return create_error_response(
                'An unexpected error occurred',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def refresh(self, request):
       
        try:
            refresh_token = request.data.get('refresh_token')

            if not refresh_token:
                return create_error_response(
                    'Refresh token is required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_TOKEN',
                )

            # Refresh token
            auth_service = get_auth_service()
            token_data = auth_service.refresh_token(refresh_token=refresh_token)

            logger.info("Token refreshed")
            return create_success_response(
                data=token_data,
                message='Token refreshed successfully',
                status_code=status.HTTP_200_OK,
            )

        except TokenRefreshError as e:
            return create_error_response(
                str(e),
                status.HTTP_401_UNAUTHORIZED,
                'INVALID_REFRESH_TOKEN',
            )
        except AuthServiceError as e:
            logger.error(f"Token refresh error: {e}")
            return create_error_response(
                str(e),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'REFRESH_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}")
            return create_error_response(
                'An unexpected error occurred',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def password_reset(self, request):
        
        try:
            email = request.data.get('email')

            if not email:
                return create_error_response(
                    'Email is required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_EMAIL',
                )

            # Request password reset
            auth_service = get_auth_service()
            result = auth_service.request_password_reset(email=email)

            logger.info(f"Password reset requested for: {email}")
            return create_success_response(
                data=result,
                message='Password reset email sent',
                status_code=status.HTTP_200_OK,
            )

        except AuthServiceError as e:
            logger.error(f"Password reset request error: {e}", exc_info=True)
            return create_error_response(
                str(e),
                status.HTTP_400_BAD_REQUEST,
                'RESET_REQUEST_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error requesting password reset: {e}", exc_info=True)
            return create_error_response(
                f'An unexpected error occurred: {str(e)}',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def password_reset_confirm(self, request):
     
        try:
            email = request.data.get('email')
            token = request.data.get('token')
            new_password = request.data.get('new_password')

            # Validation
            if not email or not token or not new_password:
                return create_error_response(
                    'Email, token, and new_password are required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_FIELDS',
                )

            if len(new_password) < 6:
                return create_error_response(
                    'Password must be at least 6 characters',
                    status.HTTP_400_BAD_REQUEST,
                    'PASSWORD_TOO_SHORT',
                )

            # Confirm password reset
            auth_service = get_auth_service()
            result = auth_service.confirm_password_reset(
                email=email,
                token=token,
                new_password=new_password,
            )

            logger.info(f"Password reset confirmed for: {email}")
            return create_success_response(
                data=result,
                message='Password reset successfully',
                status_code=status.HTTP_200_OK,
            )

        except AuthServiceError as e:
            logger.error(f"Password reset confirmation error: {e}")
            return create_error_response(
                str(e),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'RESET_CONFIRM_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error confirming password reset: {e}")
            return create_error_response(
                'An unexpected error occurred',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
       
        try:
            user_info = get_user_from_token(request)
            email = user_info['email']
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')

            if not current_password or not new_password:
                return create_error_response(
                    'Current password and new password are required',
                    status.HTTP_400_BAD_REQUEST,
                    'MISSING_FIELDS',
                )

            if len(new_password) < 6:
                return create_error_response(
                    'New password must be at least 6 characters',
                    status.HTTP_400_BAD_REQUEST,
                    'PASSWORD_TOO_SHORT',
                )

            # Change password
            auth_service = get_auth_service()
            result = auth_service.change_password(
                email=email,
                current_password=current_password,
                new_password=new_password,
            )

            logger.info(f"Password changed for user: {email}")
            return create_success_response(
                data=result,
                message='Password changed successfully',
                status_code=status.HTTP_200_OK,
            )

        except (MissingTokenError, InvalidTokenError):
            return create_error_response(
                'Invalid or missing authentication token',
                status.HTTP_401_UNAUTHORIZED,
                'INVALID_TOKEN',
            )
        except InvalidCredentialsError:
            return create_error_response(
                'Current password is incorrect',
                status.HTTP_400_BAD_REQUEST,
                'INVALID_PASSWORD',
            )
        except AuthServiceError as e:
            logger.error(f"Password change error: {e}", exc_info=True)
            return create_error_response(
                str(e),
                status.HTTP_400_BAD_REQUEST,
                'PASSWORD_CHANGE_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error changing password: {e}", exc_info=True)
            return create_error_response(
                f'An unexpected error occurred: {str(e)}',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
   
        try:
            user_info = get_user_from_token(request)
            user_id = user_info['user_id']

            # Logout
            auth_service = get_auth_service()
            result = auth_service.logout(user_id=user_id)

            logger.info(f"User logged out: {user_id}")
            return create_success_response(
                data=result,
                message='Logged out successfully',
                status_code=status.HTTP_200_OK,
            )

        except (MissingTokenError, InvalidTokenError):
            return create_error_response(
                'Invalid or missing authentication token',
                status.HTTP_401_UNAUTHORIZED,
                'INVALID_TOKEN',
            )
        except AuthServiceError as e:
            logger.error(f"Logout error: {e}")
            return create_error_response(
                str(e),
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'LOGOUT_ERROR',
            )
        except Exception as e:
            logger.error(f"Unexpected error during logout: {e}")
            return create_error_response(
                'An unexpected error occurred',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                'UNEXPECTED_ERROR',
            )
