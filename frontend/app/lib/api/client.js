const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Log a message to the console only in development mode.
 * @param {string} type - 'log' or 'error'
 * @param {...any} args - Arguments to pass to console
 */
function debugLog(type, ...args) {
  if (DEBUG) {
    if (type === 'error') {
      console.error(...args);
    } else {
      console.log(...args);
    }
  }
}

/**
 * Custom error class for API errors with additional context.
 */
class ApiError extends Error {
  constructor(message, { url, status, isNetworkError = false, originalError = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.url = url;
    this.status = status;
    this.isNetworkError = isNetworkError;
    this.originalError = originalError;
  }
}

/**
 * Perform a fetch request with enhanced error handling and logging.
 * Catches network errors and provides meaningful error messages.
 * Includes request timeout to prevent hanging requests.
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options (can include timeout in ms)
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchWithErrorHandling(url, options = {}) {
  debugLog('log', `[API] ${options.method || 'GET'} ${url}`);
  
  const timeoutMs = options.timeout || 10000;
  const controller = new AbortController();
  const signal = controller.signal;
  
  const { timeout, ...fetchOptions } = options;
  fetchOptions.signal = signal;
  
  let timeoutId;
  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const start = Date.now();
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - start;
    clearTimeout(timeoutId);
    debugLog('log', `[API] Response: ${response.status} ${response.statusText} for ${url} (${duration}ms)`);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    debugLog('error', `[API] Network error for ${url}:`, error.message || String(error));
    
    let userMessage = 'Network error: Unable to connect to the server. Please check your connection and try again.';
    
    if (error.name === 'AbortError') {
      userMessage = `Request timed out after ${timeoutMs}ms. The backend server may be unresponsive or slow.`;
    } else if (error.name === 'TypeError' && (error.message || '').includes('fetch')) {
      userMessage = 'Network error: Cannot reach the backend server. Please ensure the backend is running.';
    }
    
    throw new ApiError(userMessage, {
      url,
      isNetworkError: true,
      originalError: error
    });
  }
}

/**
 * Helper function to handle API responses consistently.
 * Throws an error with detailed message if response is not ok.
 * @param {Response} res - Fetch response object
 * @param {string} url - The request URL (for error context)
 * @param {string} errorMessage - Error message prefix
 * @returns {Promise<any>} - Parsed JSON response
 */
async function handleResponse(res, url, errorMessage) {
  if (!res.ok) {
    let errorDetails = '';
    try {
      const errorData = await res.json();
      errorDetails = errorData.error || errorData.detail || JSON.stringify(errorData);
    } catch {
      errorDetails = await res.text().catch(() => 'Unknown error');
    }
    
    const message = `${errorMessage}: ${res.status} - ${errorDetails}`;
    debugLog('error', `[API] Error response:`, message);
    
    throw new ApiError(message, {
      url,
      status: res.status,
      isNetworkError: false
    });
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

/**
 * Normalize list response to always have results array and count.
 * Handles both paginated and non-paginated responses.
 * @param {any} data - Response data
 * @returns {Object} - Normalized response with results array and count
 */
function normalizeListResponse(data) {
  if (data && typeof data === 'object' && 'results' in data) {
    return {
      count: data.count || data.results.length,
      results: data.results || []
    };
  }
  if (Array.isArray(data)) {
    return {
      count: data.length,
      results: data
    };
  }
  return {
    count: 0,
    results: []
  };
}

export { ApiError, API_BASE_URL, fetchWithErrorHandling, handleResponse, normalizeListResponse };