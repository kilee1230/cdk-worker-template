import { describe, it, expect, beforeEach } from "vitest";
import { handler } from "../src/lambda/worker/index.js";
import type { SQSEvent, Context } from "aws-lambda";

describe("Worker Lambda Handler", () => {
  // Mock Lambda context
  const createMockContext = (): Context => ({
    callbackWaitsForEmptyEventLoop: true,
    functionName: "test-function",
    functionVersion: "1",
    invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id-" + Date.now(),
    logGroupName: "/aws/lambda/test",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  });

  // Set environment variables before each test
  beforeEach(() => {
    process.env.QUEUE_URL =
      "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue";
    process.env.TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:test-topic";
    process.env.DLQ_URL =
      "https://sqs.us-east-1.amazonaws.com/123456789012/test-dlq";
    process.env.ENVIRONMENT = "test";
    process.env.LOG_LEVEL = "error"; // Use 'error' to suppress logs during tests
  });

  describe("successful message processing", () => {
    it("should process a simple SQS message successfully", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "test-message-id-1",
            receiptHandle: "test-receipt-handle",
            body: JSON.stringify({
              test: "Hello from test",
              data: "Some test data",
            }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      expect(result.batchItemFailures).toHaveLength(0);
    });

    it("should process an SNS-wrapped message successfully", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "test-message-id-2",
            receiptHandle: "test-receipt-handle",
            body: JSON.stringify({
              Type: "Notification",
              MessageId: "sns-message-id",
              TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
              Message: JSON.stringify({
                test: "Hello from SNS",
                data: "SNS wrapped data",
              }),
              Timestamp: "2024-01-01T00:00:00.000Z",
              SignatureVersion: "1",
              Signature: "test-signature",
              SigningCertURL: "https://sns.us-east-1.amazonaws.com/test.pem",
              UnsubscribeURL: "https://sns.us-east-1.amazonaws.com/unsubscribe",
            }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      expect(result.batchItemFailures).toHaveLength(0);
    });

    it("should process multiple messages in a batch", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "message-1",
            receiptHandle: "receipt-1",
            body: JSON.stringify({ id: 1, data: "Message 1" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "message-2",
            receiptHandle: "receipt-2",
            body: JSON.stringify({ id: 2, data: "Message 2" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567891000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567891000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5-2",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "message-3",
            receiptHandle: "receipt-3",
            body: JSON.stringify({ id: 3, data: "Message 3" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567892000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567892000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5-3",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      expect(result.batchItemFailures).toHaveLength(0);
    });
  });

  describe("failed message processing", () => {
    it("should handle message with shouldFail flag", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "test-message-fail",
            receiptHandle: "test-receipt-handle",
            body: JSON.stringify({
              shouldFail: true,
              data: "This should fail",
            }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe(
        "test-message-fail"
      );
    });

    it("should handle partial batch failures", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "message-success-1",
            receiptHandle: "receipt-1",
            body: JSON.stringify({ id: 1, data: "Success" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "message-fail",
            receiptHandle: "receipt-2",
            body: JSON.stringify({ shouldFail: true }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567891000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567891000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5-2",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
          {
            messageId: "message-success-2",
            receiptHandle: "receipt-3",
            body: JSON.stringify({ id: 3, data: "Success" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567892000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567892000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5-3",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      // Only the failed message should be in batch failures
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe("message-fail");
    });

    it("should handle invalid JSON in message body", async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "invalid-json-message",
            receiptHandle: "test-receipt-handle",
            body: "{ invalid json }",
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      const result = await handler(mockEvent, createMockContext());

      // Invalid JSON should cause the message to fail
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe(
        "invalid-json-message"
      );
    });
  });

  describe("environment variables", () => {
    it("should handle missing environment variables gracefully", async () => {
      // Clear environment variables
      delete process.env.QUEUE_URL;
      delete process.env.TOPIC_ARN;
      delete process.env.DLQ_URL;

      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: "test-message",
            receiptHandle: "test-receipt-handle",
            body: JSON.stringify({ test: "data" }),
            attributes: {
              ApproximateReceiveCount: "1",
              SentTimestamp: "1234567890000",
              SenderId: "test-sender",
              ApproximateFirstReceiveTimestamp: "1234567890000",
            },
            messageAttributes: {},
            md5OfBody: "test-md5",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
          },
        ],
      };

      // Should still process successfully (environment vars are logged but not required for this handler)
      const result = await handler(mockEvent, createMockContext());
      expect(result.batchItemFailures).toHaveLength(0);
    });
  });
});
