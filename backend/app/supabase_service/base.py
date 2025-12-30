# Base Supabase service class with common utilities.
# Provides lazy initialization and generic CRUD operations
# that can be inherited by entity-specific services.


import logging
import time as time_module
import uuid
from datetime import datetime, date, time
from decimal import Decimal
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class SupabaseServiceError(Exception):
    #Custom exception for Supabase service errors
    pass


class SupabaseDatabaseError(SupabaseServiceError):
    #Exception raised when there's a database error
    pass


class SupabaseConnectionError(SupabaseServiceError):
    #Exception raised when unable to connect to Supabase
    pass


class SupabaseDocumentNotFoundError(SupabaseServiceError):
    #Exception raised when a document is not found
    pass

class BaseSupabaseService:
    table_name: str = None
    _client = None  # Cached Supabase client (class-level shared)
    
    def __init__(self):
        if self.table_name is None:
            raise ValueError(f"{self.__class__.__name__} must define table_name")
        logger.debug(f"Initialized {self.__class__.__name__} for table: {self.table_name}")
    
    @property
    def client(self):
        if BaseSupabaseService._client is None:
            try:
                from app_backend.supabase_utils import (
                    get_supabase_client,
                    SupabaseConfigurationError,
                    SupabaseConnectionError as UtilsConnectionError,
                )
                logger.info("Initializing Supabase client for service...")
                BaseSupabaseService._client = get_supabase_client()
                logger.info("Supabase client ready")
            except SupabaseConfigurationError as e:
                logger.error(f"Supabase configuration error: {e}")
                raise SupabaseServiceError(f"Supabase configuration error: {e}")
            except UtilsConnectionError as e:
                raise SupabaseConnectionError(f"Failed to connect to Supabase: {e}")
            except Exception as e:
                logger.error(f"Unexpected error connecting to Supabase: {e}", exc_info=True)
                raise SupabaseServiceError(f"Failed to connect to Supabase: {str(e)}")
        return BaseSupabaseService._client
    
    @classmethod
    def reset_client(cls):
        cls._client = None
        logger.debug("Supabase client cache reset")
    
    def _convert_dates_to_strings(self, data: Dict[str, Any]) -> Dict[str, Any]:
        converted = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                converted[key] = value.isoformat()
            elif isinstance(value, date):
                converted[key] = value.isoformat()
            elif isinstance(value, time):
                converted[key] = value.isoformat()
            else:
                converted[key] = value
        return converted
    
    def _convert_decimals_to_strings(self, data: Dict[str, Any]) -> Dict[str, Any]:
        converted = {}
        for key, value in data.items():
            if isinstance(value, Decimal):
                # Convert Decimal to string for JSON serialization (preserves precision)
                converted[key] = str(value)
            else:
                converted[key] = value
        return converted
    
    def _add_timestamps(self, data: Dict[str, Any], created: bool = True) -> Dict[str, Any]:
        data = self._convert_dates_to_strings(data)
        data = self._convert_decimals_to_strings(data)
        
        now = datetime.utcnow().isoformat()
        if created:
            data['created_at'] = now
        data['updated_at'] = now
        return data
    
    def _generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def create(self, data: Dict[str, Any]) -> str:
        try:
            record_data = data.copy()
            
            if 'id' not in record_data:
                record_data['id'] = self._generate_id()
            
            record_data = self._add_timestamps(record_data, created=True)
            
            response = self.client.table(self.table_name).insert(record_data).execute()
            
            if response.data and len(response.data) > 0:
                record_id = response.data[0].get('id', record_data['id'])
                logger.info(f"Created record in {self.table_name}: {record_id}")
                return record_id
            
            raise SupabaseServiceError("No data returned from insert operation")
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to create record in {self.table_name}: {e}")
            raise SupabaseServiceError(f"Failed to create record: {e}")
    
    def get(self, record_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").eq('id', record_id).execute()   
            if response.data and len(response.data) > 0:
                logger.debug(f"Retrieved record {record_id} from {self.table_name}")
                return response.data[0]
            
            logger.debug(f"Record {record_id} not found in {self.table_name}")
            return None
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to get record {record_id} from {self.table_name}: {e}")
            raise SupabaseServiceError(f"Failed to retrieve record: {e}")
    
    def get_all(self, limit: Optional[int] = None, order_by: str = 'created_at', descending: bool = True) -> List[Dict[str, Any]]:
        try:
            start_time = time_module.time()           
            query = self.client.table(self.table_name).select("*")
            query = query.order(order_by, desc=descending)
            if limit:
                query = query.limit(limit)
            response = query.execute() 
            results = response.data or []
            elapsed = time_module.time() - start_time    
            if elapsed > 1.0: 
                logger.warning(
                    f"Slow query: {self.table_name} took {elapsed:.2f}s to fetch {len(results)} items"
                )
            else:
                logger.debug(
                    f"Retrieved {len(results)} records from {self.table_name} in {elapsed:.2f}s"
                )
            
            return results           
        except SupabaseServiceError:
            raise
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to retrieve records from {self.table_name}: {e}")
            raise SupabaseServiceError(f"Failed to retrieve records: {error_msg}")
    
    def update(self, record_id: str, data: Dict[str, Any]) -> bool:
        try:
            update_data = data.copy()
            update_data = self._add_timestamps(update_data, created=False)
            update_data.pop('id', None)   
            response = self.client.table(self.table_name).update(update_data).eq('id', record_id).execute()
            if response.data and len(response.data) > 0:
                logger.info(f"Updated record {record_id} in {self.table_name}")
                return True
            logger.debug(f"Update returned no data for record {record_id} in {self.table_name}")
            return False
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to update record {record_id} in {self.table_name}: {e}")
            raise SupabaseServiceError(f"Failed to update record: {e}")
    
    def delete(self, record_id: str) -> bool:
        try:
            response = self.client.table(self.table_name).delete().eq('id', record_id).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Deleted record {record_id} from {self.table_name}")
                return True
            logger.debug(f"Delete returned no data for record {record_id} in {self.table_name}")
            return False
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to delete record {record_id} from {self.table_name}: {e}")
            raise SupabaseServiceError(f"Failed to delete record: {e}")
    
    def query_by_field(self, field: str, value: Any) -> List[Dict[str, Any]]:
        try:
            response = self.client.table(self.table_name).select("*").eq(field, value).execute()
            
            results = response.data or []
            logger.debug(
                f"Query {self.table_name} where {field}=={value}: {len(results)} results"
            )
            return results
            
        except SupabaseServiceError:
            raise
        except Exception as e:
            logger.error(f"Failed to query {self.table_name} by {field}: {e}")
            raise SupabaseServiceError(f"Failed to query records: {e}")
