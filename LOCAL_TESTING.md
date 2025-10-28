# Local Lambda Testing Guide

This guide explains how to test your Lambda function locally without deploying to AWS.

## 🚀 Quick Start

### Method 1: Interactive Test Script (Recommended)

The easiest way to test your Lambda locally:

```bash
# Install tsx if not already installed
pnpm install

# Run all test scenarios
npm run test:lambda

# Run a specific scenario
npm run test:lambda simple      # Test simple message
npm run test:lambda sns         # Test SNS-wrapped message
npm run test:lambda batch       # Test batch processing
npm run test:lambda failure     # Test message failure handling
npm run test:lambda partial     # Test partial batch failure
```

**Features:**

- ✅ Multiple test scenarios
- ✅ Colored output
- ✅ Real Lambda handler execution
- ✅ No external dependencies
- ✅ Fast and simple

### Method 2: Unit Tests with Vitest

Run comprehensive unit tests:

```bash
# Run all tests (including Lambda tests)
npm test

# Run only Lambda tests
npm test lambda-worker

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage
npm run test:coverage
```

**Features:**

- ✅ Automated testing
- ✅ CI/CD integration
- ✅ Code coverage reports
- ✅ Multiple test scenarios
- ✅ Assertion library

### Method 3: AWS SAM CLI (Most Realistic)

For testing with Docker containers that simulate the actual Lambda runtime:

```bash
# Install SAM CLI (macOS)
brew install aws-sam-cli

# Build your CDK stack first to generate Lambda assets
npm run synth

# Invoke Lambda with a test event
sam local invoke WorkerFunction \
  --template template-local.yaml \
  --event events/sqs-event.json

# Or use other event files
sam local invoke WorkerFunction \
  --template template-local.yaml \
  --event events/sqs-batch-event.json

sam local invoke WorkerFunction \
  --template template-local.yaml \
  --event events/sns-wrapped-event.json
```

**Features:**

- ✅ Most realistic AWS environment
- ✅ Runs in Docker container
- ✅ Uses actual Lambda runtime
- ✅ Tests with real AWS SDK calls (mocked)

## 📁 Test Files Overview

### Test Events (`events/` directory)

Pre-configured SQS event files for testing:

- **`sqs-event.json`** - Single simple SQS message
- **`sqs-batch-event.json`** - Batch of 3 messages
- **`sns-wrapped-event.json`** - SNS message delivered via SQS

### Test Scripts

- **`scripts/test-lambda-local.ts`** - Interactive test script with multiple scenarios
- **`test/lambda-worker.test.ts`** - Comprehensive Vitest unit tests
- **`template-local.yaml`** - SAM template for local invocation

## 🧪 Test Scenarios Explained

### 1. Simple Message

Tests basic SQS message processing:

```json
{
  "test": "Hello from local script",
  "data": "Some test data"
}
```

**Expected:** ✅ Success, no failures

### 2. SNS-wrapped Message

Tests messages that originated from SNS and were delivered to SQS:

```json
{
  "Type": "Notification",
  "Message": "{\"test\": \"Hello from SNS\"}"
}
```

**Expected:** ✅ Success, message unwrapped correctly

### 3. Batch Messages

Tests processing multiple messages at once:

- Message 1: `{ "id": 1, "data": "Message 1" }`
- Message 2: `{ "id": 2, "data": "Message 2" }`
- Message 3: `{ "id": 3, "data": "Message 3" }`

**Expected:** ✅ All messages processed successfully

### 4. Message Failure

Tests error handling with a message that should fail:

```json
{
  "shouldFail": true,
  "data": "This message should fail"
}
```

**Expected:** ⚠️ 1 batch item failure returned

### 5. Partial Batch Failure

Tests partial batch failure handling:

- Message 1: Success
- Message 2: Failure (`shouldFail: true`)
- Message 3: Success

**Expected:** ⚠️ Only failed message returned in batchItemFailures

## 🔧 Customizing Tests

### Adding New Test Scenarios

Edit `scripts/test-lambda-local.ts` and add to `TEST_SCENARIOS`:

```typescript
const TEST_SCENARIOS = {
  // ... existing scenarios
  myTest: {
    name: "My Custom Test",
    event: {
      Records: [
        {
          messageId: "custom-test-1",
          receiptHandle: "test-receipt",
          body: JSON.stringify({
            myCustomField: "test value",
          }),
          // ... other required SQS fields
        },
      ],
    },
  },
};
```

Run with: `npm run test:lambda myTest`

### Adding New Vitest Tests

Create new test cases in `test/lambda-worker.test.ts`:

```typescript
it("should test my custom scenario", async () => {
  const mockEvent: SQSEvent = {
    Records: [
      // Your custom SQS record
    ],
  };

  const result = await handler(mockEvent, createMockContext());

  expect(result.batchItemFailures).toHaveLength(0);
});
```

### Creating New SAM Event Files

Create a new JSON file in `events/` directory:

```bash
# events/my-custom-event.json
{
  "Records": [
    {
      "messageId": "my-test-1",
      "receiptHandle": "test-receipt",
      "body": "{\"myField\": \"value\"}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1234567890000",
        "SenderId": "test-sender",
        "ApproximateFirstReceiveTimestamp": "1234567890000"
      },
      "messageAttributes": {},
      "md5OfBody": "test-md5",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:test-queue",
      "awsRegion": "us-east-1"
    }
  ]
}
```

Test with SAM:

```bash
sam local invoke WorkerFunction \
  --template template-local.yaml \
  --event events/my-custom-event.json
```

## 🐛 Debugging Tips

### Enable Debug Logging

Set `LOG_LEVEL` environment variable in your test script:

```typescript
process.env.LOG_LEVEL = "debug"; // Show all logs
```

Or in SAM template:

```yaml
Environment:
  Variables:
    LOG_LEVEL: debug
```

### Using VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Lambda Test",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/tsx/dist/cli.mjs",
      "args": ["scripts/test-lambda-local.ts", "simple"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "lambda-worker"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Common Issues

#### Issue: `tsx: command not found`

**Solution:**

```bash
pnpm install
# or
npm install tsx --save-dev
```

#### Issue: SAM can't find Lambda code

**Solution:**

```bash
# Build CDK first to generate Lambda assets
npm run synth
```

The Lambda code is bundled during synthesis and placed in `cdk.out/asset.*/`

#### Issue: Import errors with `.js` extensions

This project uses ES modules. Make sure:

- `package.json` has `"type": "module"`
- Imports use `.js` extension: `import { handler } from "./index.js"`

## 📊 Comparing Test Methods

| Method                 | Speed    | Realism   | Setup  | Best For                  |
| ---------------------- | -------- | --------- | ------ | ------------------------- |
| **Interactive Script** | ⚡️ Fast | Good      | Easy   | Quick iteration           |
| **Vitest**             | ⚡️ Fast | Good      | Easy   | Automated testing         |
| **SAM CLI**            | 🐌 Slow  | Excellent | Medium | Pre-deployment validation |

## 🎯 Best Practices

1. **Start with Interactive Script** for rapid development and debugging
2. **Write Vitest tests** for all business logic and edge cases
3. **Use SAM CLI** before deploying to validate AWS SDK interactions
4. **Test all scenarios:**

   - ✅ Happy path (successful processing)
   - ⚠️ Error handling (failures and retries)
   - 📦 Batch processing (multiple messages)
   - 🔄 SNS-wrapped messages
   - 🔀 Partial batch failures

5. **Mock external services** (databases, APIs) in tests
6. **Use environment variables** to configure behavior
7. **Check coverage** regularly: `npm run test:coverage`

## 🔗 Related Resources

- [AWS Lambda Testing Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/testing-functions.html)
- [AWS SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference.html)
- [Vitest Documentation](https://vitest.dev/)
- [SQS Lambda Integration](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)

## 💡 Next Steps

After testing locally:

1. **Deploy to AWS**: `npm run deploy`
2. **Test in AWS**:

   ```bash
   # Get outputs
   aws cloudformation describe-stacks \
     --stack-name WorkerStack \
     --query 'Stacks[0].Outputs'

   # Send test message
   aws sns publish \
     --topic-arn <TOPIC_ARN> \
     --message '{"test": "Hello from AWS"}'

   # Check logs
   aws logs tail /aws/lambda/<FUNCTION_NAME> --follow
   ```

3. **Monitor**: Set up CloudWatch alarms for errors and DLQ messages
4. **Iterate**: Update Lambda code, test locally, then redeploy
