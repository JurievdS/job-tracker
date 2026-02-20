/**
 * Extract a human-readable error message from an API error response.
 * Handles Zod validation details, server error messages, and fallbacks.
 */
export function parseApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: string; details?: Array<{ path: (string | number)[]; message: string }> } } }).response;
    // Zod validation errors — show first field error
    if (resp?.data?.details?.length) {
      const d = resp.data.details[0];
      return d.message;
    }
    // Server error message (e.g. 409 conflict)
    if (resp?.data?.error) {
      return resp.data.error;
    }
  }
  return fallback;
}
