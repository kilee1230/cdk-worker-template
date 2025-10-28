import type {
  SQSEvent,
  SQSBatchResponse,
  SQSBatchItemFailure,
  Context,
} from "aws-lambda";
import { logger } from "../../utils/logger.js";

/**
 * Worker Lambda Function
 * Processes messages from SQS queue
 */

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  // Add Lambda context to logger
  const requestLogger = logger.child({
    awsRequestId: context.awsRequestId,
    functionName: context.functionName,
  });

  requestLogger.info({ event }, "Event received");

  // Environment variables
  const queueUrl = process.env.QUEUE_URL;
  const topicArn = process.env.TOPIC_ARN;
  const dlqUrl = process.env.DLQ_URL;
  const environment = process.env.ENVIRONMENT;
  const logLevel = process.env.LOG_LEVEL;

  requestLogger.info(
    {
      queueUrl,
      topicArn,
      dlqUrl,
      environment,
      logLevel,
    },
    "Environment Configuration"
  );

  const batchItemFailures: SQSBatchItemFailure[] = [];

  // Process each record from SQS
  for (const record of event.Records) {
    try {
      requestLogger.info({ messageId: record.messageId }, "Processing message");

      // Parse the message body
      const messageBody = JSON.parse(record.body);

      // If the message came from SNS, extract the SNS message
      let message = messageBody;
      if (messageBody.Message) {
        message = JSON.parse(messageBody.Message);
      }

      requestLogger.info({ message }, "Parsed message");

      // ============================================
      // YOUR BUSINESS LOGIC GOES HERE
      // ============================================

      // Example: Process the message
      await processMessage(message, requestLogger);

      requestLogger.info(
        { messageId: record.messageId },
        "Successfully processed message"
      );
    } catch (error) {
      requestLogger.error(
        { messageId: record.messageId, error },
        "Error processing message"
      );

      // Add failed message to batch item failures
      // This will return the message to the queue for retry
      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  // Return batch item failures for partial batch responses
  // Messages not in this list will be deleted from the queue
  return {
    batchItemFailures,
  };
};

/**
 * Process the message - implement your business logic here
 */
async function processMessage(
  message: any,
  logger: any
): Promise<{ success: boolean }> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Example: validate message structure
  if (!message || typeof message !== "object") {
    throw new Error("Invalid message format");
  }

  // Add your business logic here
  logger.info({ message }, "Processing business logic");

  // Example: If message has a specific field that should cause a retry
  if (message.shouldFail) {
    throw new Error("Message processing failed intentionally");
  }

  return { success: true };
}
