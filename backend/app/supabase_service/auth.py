# Authentication service for Supabase Auth integration.
# Handles user signup, login, token management, and profile operations.

import logging
import jwt
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


class AuthServiceError(Exception):
    """Base exception for authentication service errors"""
    pass


class InvalidCredentialsError(AuthServiceError):
    """Raised when credentials are invalid"""
    pass


class UserAlreadyExistsError(AuthServiceError):
    """Raised when user already exists"""
    pass


class UserNotFoundError(AuthServiceError):
    """Raised when user is not found"""
    pass


class TokenRefreshError(AuthServiceError):
    """Raised when token refresh fails"""
    pass


class SupabaseAuthService:
  
    def __init__(self):
        self.supabase_client = None
        self._initialize_client()

    def _initialize_client(self):
        try:
            from app_backend.supabase_utils import get_supabase_client
            self.supabase_client = get_supabase_client()
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise AuthServiceError("Failed to initialize authentication service")

    @property
    def client(self):
        if self.supabase_client is None:
            self._initialize_client()
        return self.supabase_client

    def signup(
        self,
        email: str,
        password: str,
        full_name: Optional[str] = None,
    ) -> Dict:
      
        try:
            # Sign up with Supabase Auth
            response = self.client.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                }
            )

            user = response.user
            if not user:
                raise AuthServiceError("Signup failed: No user returned from Supabase")

            logger.info(f"User signed up successfully: {user.id}")

            # Generate JWT tokens for our backend
            refresh_token = RefreshToken()
            refresh_token['user_id'] = str(user.id)
            refresh_token['email'] = user.email

            return {
                'user_id': str(user.id),
                'email': user.email,
                'full_name': full_name or "",
                'access_token': str(refresh_token.access_token),
                'refresh_token': str(refresh_token),
                'token_type': 'Bearer',
                'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            }

        except Exception as e:
            if "User already registered" in str(e):
                logger.warning(f"User already exists: {email}")
                raise UserAlreadyExistsError("User with this email already exists")
            logger.error(f"Signup failed: {e}")
            raise AuthServiceError(f"Signup failed: {str(e)}")

    def login(self, email: str, password: str) -> Dict:
        
        try:
            # Authenticate with Supabase
            response = self.client.auth.sign_in_with_password(
                {
                    "email": email,
                    "password": password,
                }
            )

            user = response.user
            if not user:
                raise AuthServiceError("Login failed: No user returned from Supabase")

            logger.info(f"User logged in successfully: {user.id}")

            # Generate JWT tokens for our backend
            refresh_token = RefreshToken()
            refresh_token['user_id'] = str(user.id)
            refresh_token['email'] = user.email

            return {
                'user_id': str(user.id),
                'email': user.email,
                'access_token': str(refresh_token.access_token),
                'refresh_token': str(refresh_token),
                'token_type': 'Bearer',
                'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            }

        except Exception as e:
            if "Invalid login credentials" in str(e):
                logger.warning(f"Invalid login attempt: {email}")
                raise InvalidCredentialsError("Invalid email or password")
            logger.error(f"Login failed: {e}")
            raise AuthServiceError(f"Login failed: {str(e)}")

    def refresh_token(self, refresh_token: str) -> Dict:
       
        try:
            # Decode and validate refresh token
            token = RefreshToken(refresh_token)

            # Generate new access token
            new_access_token = str(token.access_token)

            logger.info(f"Token refreshed for user: {token.get('user_id')}")

            return {
                'access_token': new_access_token,
                'refresh_token': str(token),  # Return new refresh token if rotated
                'token_type': 'Bearer',
                'expires_in': int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()),
            }

        except TokenError as e:
            logger.warning(f"Token refresh failed: {e}")
            raise TokenRefreshError(f"Invalid or expired refresh token: {str(e)}")
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            raise AuthServiceError(f"Token refresh failed: {str(e)}")

    def request_password_reset(self, email: str) -> Dict:
 
        try:
            # Request password reset
            response = self.client.auth.reset_password_for_email(email)

            logger.info(f"Password reset email sent to: {email}")

            return {
                'message': 'Password reset email sent',
                'email': email,
            }

        except Exception as e:
            logger.error(f"Failed to request password reset: {e}")
            raise AuthServiceError(f"Failed to request password reset: {str(e)}")

    def confirm_password_reset(
        self,
        email: str,
        token: str,
        new_password: str,
    ) -> Dict:
   
        try:
            # Verify token and reset password
            response = self.client.auth.verify_otp({
                "email": email,
                "token": token,
                "type": "recovery",
            })

            if not response.user:
                raise AuthServiceError("Invalid or expired reset token")

            # Update password
            self.client.auth.admin.update_user_by_id(
                response.user.id,
                {"password": new_password}
            )

            logger.info(f"Password reset confirmed for: {email}")

            return {
                'message': 'Password has been reset successfully',
                'email': email,
            }

        except Exception as e:
            logger.error(f"Failed to confirm password reset: {e}")
            raise AuthServiceError(f"Failed to reset password: {str(e)}")

    def logout(self, user_id: str) -> Dict:
    
        try:
            logger.info(f"User logged out: {user_id}")
            return {
                'message': 'Logged out successfully',
                'user_id': user_id,
            }

        except Exception as e:
            logger.error(f"Logout failed: {e}")
            raise AuthServiceError(f"Logout failed: {str(e)}")

    def verify_token(self, token: str) -> Dict:
   
        try:
            decoded = jwt.decode(
                token,
                settings.SIMPLE_JWT['SIGNING_KEY'],
                algorithms=['HS256'],
            )
            return decoded
        except jwt.ExpiredSignatureError:
            raise TokenRefreshError("Token has expired")
        except jwt.InvalidTokenError as e:
            raise TokenRefreshError(f"Invalid token: {str(e)}")

    def change_password(
        self,
        email: str,
        current_password: str,
        new_password: str,
    ) -> Dict:
     
        try:
            # For password changes, we need to verify the current password first
            # We'll do this by attempting a sign-in with the provided credentials
            try:
                # Verify current password by attempting sign-in
                self.client.auth.sign_in_with_password({
                    "email": email,
                    "password": current_password
                })
                
                # If sign-in succeeded, the password is correct
                # Now update to new password
                self.client.auth.update_user({
                    "password": new_password
                })
                
                logger.info(f"Password changed successfully for: {email}")
                return {
                    'message': 'Password changed successfully',
                    'email': email,
                }
                
            except Exception as e:
                error_msg = str(e).lower()
                # Check if it's an authentication error
                if any(keyword in error_msg for keyword in ['invalid', 'unauthorized', 'credentials', 'forbidden']):
                    logger.warning(f"Invalid credentials provided for {email}")
                    raise InvalidCredentialsError("Current password is incorrect")
                else:
                    logger.error(f"Error during password change: {e}", exc_info=True)
                    raise AuthServiceError(f"Failed to change password: {str(e)}")

        except InvalidCredentialsError:
            raise
        except AuthServiceError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in change_password: {e}", exc_info=True)
            raise AuthServiceError(f"Failed to change password: {str(e)}")

    def change_email(
        self,
        email: str,
        current_password: str,
        new_email: str,
    ) -> Dict:
      
        try:
            # First verify current password by attempting sign-in
            # This establishes an auth session needed for update_user()
            self.client.auth.sign_in_with_password({
                "email": email,
                "password": current_password
            })
            
            # If sign-in succeeded, update email
            self.client.auth.update_user({
                "email": new_email
            })
            
            logger.info(f"Email change requested from {email} to {new_email}")
            return {
                'message': 'Confirmation email sent to your new address',
                'email': new_email,
            }

        except Exception as e:
            error_msg = str(e).lower()
            # Check if it's an authentication error
            if any(keyword in error_msg for keyword in ['invalid', 'unauthorized', 'credentials', 'forbidden']):
                logger.warning(f"Invalid credentials provided for {email}")
                raise InvalidCredentialsError("Current password is incorrect")
            # Check if it's an email already in use error
            elif any(keyword in error_msg for keyword in ['already', 'exists', 'duplicate', 'unique']):
                logger.warning(f"Email already in use: {new_email}")
                raise AuthServiceError("This email is already in use")
            else:
                logger.error(f"Error during email change: {e}", exc_info=True)
                raise AuthServiceError(f"Failed to change email: {str(e)}")

_auth_service = None


def get_auth_service() -> SupabaseAuthService:
    """Get or create singleton instance of SupabaseAuthService"""
    global _auth_service
    if _auth_service is None:
        _auth_service = SupabaseAuthService()
    return _auth_service
