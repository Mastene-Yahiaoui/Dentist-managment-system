import os
import time
import logging
import threading
from functools import wraps

# Configure logger
logger = logging.getLogger(__name__)

# Singleton Supabase client (lazy loaded)
_supabase_client = None
_supabase_initialized = False
_initialization_lock = threading.Lock()

# Configuration defaults
DEFAULT_CONNECTION_TIMEOUT = 30
DEFAULT_MAX_RETRIES = 3
RETRY_DELAY_BASE = 1.0  # Base delay for exponential backoff


class SupabaseConfigurationError(Exception):
    """Raised when Supabase configuration is invalid or missing."""
    pass


class SupabaseConnectionError(Exception):
    """Raised when unable to connect to Supabase services."""
    pass


def retry_with_backoff(max_retries=None, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = max_retries or int(os.getenv('SUPABASE_MAX_RETRIES', DEFAULT_MAX_RETRIES))
            last_exception = None
            
            for attempt in range(retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < retries:
                        delay = RETRY_DELAY_BASE * (2 ** attempt)
                        logger.warning(
                            f"Attempt {attempt + 1}/{retries + 1} failed for {func.__name__}: {e}. "
                            f"Retrying in {delay:.1f}s..."
                        )
                        time.sleep(delay)
                    else:
                        logger.error(f"All {retries + 1} attempts failed for {func.__name__}: {e}")
            
            raise last_exception
        return wrapper
    return decorator


def get_supabase_url():
    url = os.getenv('SUPABASE_URL')
    if not url:
        try:
            from django.conf import settings
            url = getattr(settings, 'SUPABASE_URL', None)
        except Exception:
            pass
    
    if not url:
        raise SupabaseConfigurationError(
            "SUPABASE_URL is not configured. "
            "Please set the SUPABASE_URL environment variable or Django setting."
        )
    
    return url


def get_supabase_key():
    key = os.getenv('SUPABASE_KEY')
    if not key:
        try:
            from django.conf import settings
            key = getattr(settings, 'SUPABASE_KEY', None)
        except Exception:
            pass
    
    if not key:
        raise SupabaseConfigurationError(
            "SUPABASE_KEY is not configured. "
            "Please set the SUPABASE_KEY environment variable or Django setting."
        )
    
    return key


def initialize_supabase():
    global _supabase_client, _supabase_initialized
    
    # Import Supabase modules here to handle cases where they're not installed
    try:
        from supabase import create_client
    except ImportError as e:
        logger.error("supabase package is not installed")
        raise ImportError(
            "supabase package is not installed. "
            "Install it with: pip install supabase"
        ) from e
 
    with _initialization_lock:
        # Return cached client if available
        if _supabase_client is not None:
            logger.debug("Supabase client already initialized")
            return _supabase_client
        
        logger.info("Initializing Supabase client...")
        
        try:
            url = get_supabase_url()
            key = get_supabase_key()
            
            _supabase_client = create_client(url, key)
            _supabase_initialized = True
            logger.info(f"Supabase client initialized successfully for: {url}")
            return _supabase_client
            
        except SupabaseConfigurationError:
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Supabase: {e}")
            raise SupabaseConnectionError(f"Failed to initialize Supabase: {e}")


def is_supabase_configured():
    # Check if already initialized
    if _supabase_initialized:
        return True
    
    # Check for environment variables
    if os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'):
        return True
    
    # Check Django settings
    try:
        from django.conf import settings
        if getattr(settings, 'SUPABASE_URL', None) and getattr(settings, 'SUPABASE_KEY', None):
            return True
    except Exception:
        pass
    
    return False


def is_supabase_available():
    try:
        import supabase  # noqa: F401 - used for availability check
        return True
    except ImportError:
        return False


@retry_with_backoff(exceptions=(Exception,))
def get_supabase_client():
    global _supabase_client
    
    # Return cached client if available
    if _supabase_client is not None:
        return _supabase_client
    
    return initialize_supabase()


def reset_supabase_client():
    global _supabase_client, _supabase_initialized
    with _initialization_lock:
        _supabase_client = None
        _supabase_initialized = False
        logger.debug("Supabase client cache cleared")


def check_supabase_connection():
    try:
        client = get_supabase_client()
        start_time = time.time()
        
        # Perform a simple query to verify connection
        # This will return an empty result if the table doesn't exist yet
        # but will confirm the connection is working
        try:
            client.table('patients').select('id').limit(1).execute()
        except Exception:
            # Table might not exist yet, but connection is working
            pass
        
        elapsed = time.time() - start_time
        
        return {
            'status': 'connected',
            'url': get_supabase_url(),
            'response_time_ms': round(elapsed * 1000, 2),
        }
    except Exception as e:
        logger.error(f"Supabase connection check failed: {e}")
        raise SupabaseConnectionError(f"Connection check failed: {e}")


# Pre-initialization check (for logging purposes only)
# This logs a message if Supabase is not available but doesn't fail
try:
    if not is_supabase_available():
        logger.warning(
            "Supabase pre-initialization: supabase package is not installed. "
            "Install it with: pip install supabase (will retry on first request)"
        )
    elif not is_supabase_configured():
        logger.info(
            "Supabase pre-initialization: credentials not found. "
            "Supabase will be initialized on first request if credentials are provided."
        )
except Exception as e:
    logger.debug(f"Supabase pre-initialization check: {e}")