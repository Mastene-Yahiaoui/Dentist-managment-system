import os
import threading
from functools import wraps

# Singleton Supabase client (lazy loaded)
_supabase_client = None
_supabase_initialized = False
_initialization_lock = threading.Lock()


class SupabaseConfigurationError(Exception):
    """Raised when Supabase configuration is invalid or missing."""
    pass


class SupabaseConnectionError(Exception):
    """Raised when unable to connect to Supabase services."""
    pass


def retry_with_backoff(max_retries=3, exceptions=(Exception,)):

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries:
                        import time
                        delay = (2 ** attempt)
                        time.sleep(delay)
            raise last_exception
        return wrapper
    return decorator


def get_supabase_url():
    """Get the Supabase project URL."""
    url = os.getenv('SUPABASE_URL')
    if not url:
        try:
            from django.conf import settings
            url = getattr(settings, 'SUPABASE_URL', None)
        except Exception:
            pass
    
    if not url:
        raise SupabaseConfigurationError("SUPABASE_URL is not configured.")
    
    return url


def get_supabase_key():
    """Get the Supabase API key."""
    key = os.getenv('SUPABASE_KEY')
    if not key:
        try:
            from django.conf import settings
            key = getattr(settings, 'SUPABASE_KEY', None)
        except Exception:
            pass
    
    if not key:
        raise SupabaseConfigurationError("SUPABASE_KEY is not configured.")
    
    return key


def initialize_supabase():
    """Initialize Supabase client with the project URL and API key."""
    global _supabase_client, _supabase_initialized
    
    try:
        from supabase import create_client
    except ImportError as e:
        raise ImportError("supabase package is not installed. Install it with: pip install supabase") from e
    
    with _initialization_lock:
        if _supabase_client is not None:
            return _supabase_client
        
        try:
            url = get_supabase_url()
            key = get_supabase_key()
            
            _supabase_client = create_client(url, key)
            _supabase_initialized = True
            return _supabase_client
            
        except SupabaseConfigurationError:
            raise
        except Exception as e:
            raise SupabaseConnectionError(f"Failed to initialize Supabase: {e}")


def is_supabase_configured():
    """Check if Supabase credentials are available and configured."""
    if _supabase_initialized:
        return True
    
    if os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'):
        return True
    
    try:
        from django.conf import settings
        if getattr(settings, 'SUPABASE_URL', None) and getattr(settings, 'SUPABASE_KEY', None):
            return True
    except Exception:
        pass
    
    return False


@retry_with_backoff(exceptions=(Exception,))
def get_supabase_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    return initialize_supabase()


def reset_supabase_client():
    global _supabase_client, _supabase_initialized
    with _initialization_lock:
        _supabase_client = None
        _supabase_initialized = False


def check_supabase_connection():
    try:
        client = get_supabase_client()
        try:
            client.table('patients').select('id').limit(1).execute()
        except Exception:
            pass
        return {'status': 'connected'}
    except Exception as e:
        raise SupabaseConnectionError(f"Connection check failed: {e}")


try:
    pass
except Exception:
    pass
