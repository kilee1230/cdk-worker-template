#!/usr/bin/env node
/**
 * Local Lambda Testing Script
 *
 * This script allows you to quickly test your Lambda function locally
 * without deploying to AWS or running additional tools.
 *
 * Usage:
 *   npm run test:lambda
 *   # or
 *   npx tsx scripts/test-lambda-local.ts
 */

import { handler } from "../src/lambda/worker/index.js";
import type { SQSEvent, Context } from "aws-lambda";

// Test scenarios
const TEST_SCENARIOS = {
  simple: {
    name: "Simple Message",
    event: {
      Records: [
        {
          messageId: "local-test-1",
          receiptHandle: "test-receipt-handle",
          body: JSON.stringify({
            test: "Hello from local script",
            data: "Some test data",
            timestamp: new Date().toISOString(),
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
  sns: {
    name: "SNS-wrapped Message",
    event: {
      Records: [
        {
          messageId: "local-test-2",
          receiptHandle: "test-receipt-handle",
          body: JSON.stringify({
            Type: "Notification",
            MessageId: "sns-message-id",
            TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
            Message: JSON.stringify({
              test: "Hello from SNS",
              data: "SNS wrapped data",
              timestamp: new Date().toISOString(),
            }),
            Timestamp: new Date().toISOString(),
            SignatureVersion: "1",
            Signature: "test-signature",
            SigningCertURL: "https://sns.us-east-1.amazonaws.com/test.pem",
            UnsubscribeURL: "https://sns.us-east-1.amazonaws.com/unsubscribe",
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
  batch: {
    name: "Batch Messages",
    event: {
      Records: [
        {
          messageId: "batch-message-1",
          receiptHandle: "receipt-1",
          body: JSON.stringify({ id: 1, data: "Message 1" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-1",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
        {
          messageId: "batch-message-2",
          receiptHandle: "receipt-2",
          body: JSON.stringify({ id: 2, data: "Message 2" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-2",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
        {
          messageId: "batch-message-3",
          receiptHandle: "receipt-3",
          body: JSON.stringify({ id: 3, data: "Message 3" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-3",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
  failure: {
    name: "Message with Failure",
    event: {
      Records: [
        {
          messageId: "failure-test",
          receiptHandle: "test-receipt-handle",
          body: JSON.stringify({
            shouldFail: true,
            data: "This message should fail",
          }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
  partial: {
    name: "Partial Batch Failure",
    event: {
      Records: [
        {
          messageId: "success-1",
          receiptHandle: "receipt-1",
          body: JSON.stringify({ id: 1, data: "Success" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-1",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
        {
          messageId: "failure",
          receiptHandle: "receipt-2",
          body: JSON.stringify({ shouldFail: true }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-2",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
        {
          messageId: "success-2",
          receiptHandle: "receipt-3",
          body: JSON.stringify({ id: 3, data: "Success" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "local-test",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "test-md5-3",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
};

// Mock Lambda context
const createMockContext = (): Context => ({
  callbackWaitsForEmptyEventLoop: true,
  functionName: "local-test-function",
  functionVersion: "$LATEST",
  invokedFunctionArn:
    "arn:aws:lambda:us-east-1:123456789012:function:local-test",
  memoryLimitInMB: "128",
  awsRequestId: "local-request-" + Date.now(),
  logGroupName: "/aws/lambda/local-test",
  logStreamName: "local-stream",
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
});

// Set environment variables
function setupEnvironment() {
  process.env.QUEUE_URL =
    "https://sqs.us-east-1.amazonaws.com/123456789012/test-queue";
  process.env.TOPIC_ARN = "arn:aws:sns:us-east-1:123456789012:test-topic";
  process.env.DLQ_URL =
    "https://sqs.us-east-1.amazonaws.com/123456789012/test-dlq";
  process.env.ENVIRONMENT = "local";
  process.env.LOG_LEVEL = "debug";
}

async function runTest(scenarioKey: keyof typeof TEST_SCENARIOS) {
  const scenario = TEST_SCENARIOS[scenarioKey];
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Testing: ${scenario.name}`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    const result = await handler(
      scenario.event as SQSEvent,
      createMockContext()
    );

    console.log(`\n${"─".repeat(60)}`);
    console.log("✅ Lambda execution completed");
    console.log(`${"─".repeat(60)}`);
    console.log("\n📊 Result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.batchItemFailures.length > 0) {
      console.log(
        `\n⚠️  ${result.batchItemFailures.length} message(s) failed:`
      );
      result.batchItemFailures.forEach((failure) => {
        console.log(`   - ${failure.itemIdentifier}`);
      });
    } else {
      console.log("\n✨ All messages processed successfully!");
    }
  } catch (error) {
    console.log(`\n${"─".repeat(60)}`);
    console.log("❌ Lambda execution failed");
    console.log(`${"─".repeat(60)}`);
    console.error("\n🔥 Error:", error);
  }
}

async function runAllTests() {
  console.log("\n🚀 Starting Local Lambda Tests");
  console.log(`${"=".repeat(60)}`);

  setupEnvironment();

  const scenarios = Object.keys(TEST_SCENARIOS) as Array<
    keyof typeof TEST_SCENARIOS
  >;

  for (const scenario of scenarios) {
    await runTest(scenario);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🏁 All tests completed!");
  console.log(`${"=".repeat(60)}\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const scenario = args[0] as keyof typeof TEST_SCENARIOS | undefined;

if (scenario && !TEST_SCENARIOS[scenario]) {
  console.error(`\n❌ Unknown scenario: ${scenario}`);
  console.log("\n📋 Available scenarios:");
  Object.keys(TEST_SCENARIOS).forEach((key) => {
    console.log(
      `   - ${key}: ${TEST_SCENARIOS[key as keyof typeof TEST_SCENARIOS].name}`
    );
  });
  console.log("\nUsage:");
  console.log("   npm run test:lambda              # Run all scenarios");
  console.log("   npm run test:lambda simple       # Run specific scenario");
  process.exit(1);
}

// Run tests
setupEnvironment();

if (scenario) {
  runTest(scenario).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else {
  runAllTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
