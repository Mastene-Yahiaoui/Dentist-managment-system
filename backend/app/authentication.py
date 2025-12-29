# Custom JWT Authentication for Supabase
# Validates JWT tokens from Supabase without looking up Django users
# (since we use Supabase auth, not Django auth)

import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

logger = logging.getLogger(__name__)


class SupabaseJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that validates tokens from Supabase.
    Unlike default simplejwt, this does NOT look up Django User objects
    since we use Supabase for authentication.
    """

    def get_user(self, validated_token):
        """
        Override to skip Django user lookup.
        We store user info in the token itself.
        """
        try:
            # Extract user info from token
            user_id = validated_token.get('user_id')
            email = validated_token.get('email')
            
            if not user_id:
                raise InvalidToken('Token does not contain user_id')
            
            # Return a simple object with user info
            # (not a Django User model instance)
            class SupabaseUser:
                def __init__(self, user_id, email):
                    self.id = user_id
                    self.email = email
                    self.is_authenticated = True
                
                def __str__(self):
                    return f"SupabaseUser({self.email})"
            
            return SupabaseUser(user_id, email)
        
        except Exception as e:
            logger.error(f"Failed to get user from token: {e}")
            raise InvalidToken('Invalid token')
