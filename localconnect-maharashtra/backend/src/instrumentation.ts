/**
 * OpenTelemetry → remote Jaeger (OTLP).
 * Must be imported before any other application modules (see index.ts).
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
const enabled = process.env.OTEL_TRACES_ENABLED !== 'false' && !!endpoint;

if (enabled && endpoint) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'localconnect-backend';
  const serviceVersion = process.env.OTEL_SERVICE_VERSION || '1.0.0';

  const traceExporter = new OTLPTraceExporter({
    url: endpoint.endsWith('/v1/traces') ? endpoint : `${endpoint.replace(/\/$/, '')}/v1/traces`,
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: true },
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-ioredis': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log(`[tracing] Exporting traces to ${endpoint} (service: ${serviceName})`);

  const shutdown = () => {
    sdk
      .shutdown()
      .then(() => console.log('[tracing] SDK shut down'))
      .catch((err) => console.error('[tracing] Shutdown error', err));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} else {
  console.log('[tracing] Disabled — set OTEL_EXPORTER_OTLP_ENDPOINT to enable Jaeger');
}
