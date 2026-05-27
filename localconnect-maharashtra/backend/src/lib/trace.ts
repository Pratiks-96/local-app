import { trace, SpanStatusCode, type Span } from '@opentelemetry/api';

const tracer = trace.getTracer('localconnect-backend');

/** Manual span for business logic (e.g. registration, post create) */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        for (const [k, v] of Object.entries(attributes)) {
          span.setAttribute(k, v);
        }
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof Error) span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export { tracer };
