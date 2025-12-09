from django.apps import AppConfig


class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'
    def ready(self):
     
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            from app_backend.supabase_utils import (
                is_supabase_available,
                is_supabase_configured,
                get_supabase_client,
            )
            
            # Only attempt to initialize if Supabase SDK is installed
            if not is_supabase_available():
                logger.info(
                    "Supabase pre-initialization skipped: supabase package not installed. "
                    "Install it with: pip install supabase"
                )
                return
            
            # Only attempt to initialize if credentials are configured
            if not is_supabase_configured():
                logger.info(
                    "Supabase pre-initialization skipped: credentials not configured. "
                    "Set SUPABASE_URL and SUPABASE_KEY environment variables."
                )
                return
            
            # Attempt to initialize Supabase client
            get_supabase_client()
            logger.info("Supabase pre-initialized successfully on application startup")
            
        except Exception as e:
            # Log but don't fail - Supabase will be initialized lazily on first request
            logger.warning(f"Supabase pre-initialization: {e} (will retry on first request)")
