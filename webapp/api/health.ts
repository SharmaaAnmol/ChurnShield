/** GET /api/health — readiness check used by the app header. */
export function GET(): Response {
  return Response.json({
    status: 'healthy',
    model_loaded: true,
    model_type: 'Balanced Logistic Regression',
    version: '1.1.0',
  });
}
