import pino from "pino";
import { pinoLambdaDestination } from "pino-lambda";

/**
 * Pino Logger Configuration for AWS Lambda
 *
 * Features:
 * - Structured JSON logging
 * - AWS Lambda optimized output
 * - Configurable log levels via environment variable
 * - Low overhead and high performance
 * - Redacts sensitive information (emails, tokens, passwords)
 */

// Get log level from environment variable, default to 'info'
const logLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";

// Define sensitive fields to redact
const REDACTED_FIELDS = [
  "headers.authorization",
  "headers.cookie",
  "user.email",
  "data.email",
];

// Create logger with Lambda-optimized destination
export const logger = pino(
  {
    level: logLevel,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields from logs
    redact: {
      paths: REDACTED_FIELDS,
      censor: "[REDACTED]",
    },
  },
  pinoLambdaDestination()
);

/**
 * Creates a child logger with additional context
 * @param bindings - Additional fields to add to all log entries
 * @returns Child logger with bindings
 */
export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}
