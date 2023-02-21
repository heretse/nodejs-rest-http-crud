'use strict';

const { diag, trace, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// SDK
const opentelemetry = require('@opentelemetry/sdk-node');

// Express, postgres and http instrumentation
// const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
// const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

// Collector trace exporter
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
// const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
// const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const grpc = require("@grpc/grpc-js");
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector-grpc");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Tracer provider
// const provider = new NodeTracerProvider({
//   resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'fruits' })
// });

// registerInstrumentations({
//   instrumentations: [
//     // Currently to be able to have auto-instrumentation for express
//     // We need the auto-instrumentation for HTTP.
//     new HttpInstrumentation(),
//     new ExpressInstrumentation(),
//     new PgInstrumentation()
//   ]
// });

// Tracer exporter
// const traceExporter = new OTLPTraceExporter({ url: 'http://localhost:/v1/traces' });
// provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
// provider.register();

var meta = new grpc.Metadata();
meta.add("x-sls-otel-project", "express-web");
const collectorOptions = {
  url: "http://192.168.80.8:55680",
  metadata: meta,
};
const traceExporter = new CollectorTraceExporter(collectorOptions);

// SDK configuration and start up
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'express-web',
  }),
  traceExporter: traceExporter,
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PgInstrumentation(),
    getNodeAutoInstrumentations()
  ]
});

(async () => {
  try {
    await sdk.start();
    console.log('Tracing started.');
  } catch (error) {
    console.error(error);
  }
})();

// For local development to stop the tracing using Control+c
process.on('SIGINT', async () => {
  try {
    await sdk.shutdown();
    console.log('Tracing finished.');
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
});

module.exports = trace;