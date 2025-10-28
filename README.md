# CDK Worker Template

This is a CDK (Cloud Development Kit) project template written in TypeScript that implements a serverless event-driven architecture using SNS, SQS, Lambda, and Dead Letter Queue (DLQ).

## Architecture

This template creates the following AWS resources:

```
SNS Topic → SQS Queue → Lambda Function
                ↓ (after 3 failed attempts)
            Dead Letter Queue
```

### Components:

- **SNS Topic**: Entry point for messages/events
- **SQS Queue**: Buffers messages before Lambda processing
- **Lambda Function**: Processes messages with configurable environment variables
- **Dead Letter Queue (DLQ)**: Captures failed messages after 3 retry attempts
- **IAM Roles & Permissions**: Automatically configured for secure access

### Features:

- ✅ Automatic retry logic (3 attempts before moving to DLQ)
- ✅ Batch processing (up to 10 messages per invocation)
- ✅ Partial batch failure handling
- ✅ Environment variables for configuration
- ✅ CloudWatch Logs integration
- ✅ CloudFormation outputs for easy resource reference

## Prerequisites

- Node.js (v18 or later)
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the TypeScript code:**

   ```bash
   npm run build
   ```

   This compiles the CDK infrastructure (`infra/` → `lib/`). Lambda functions in `src/` are bundled separately by esbuild at deployment time.

3. **Bootstrap your AWS environment (if you haven't already):**

   ```bash
   cdk bootstrap
   ```

   This only needs to be done once per AWS account/region.

4. **Synthesize the CloudFormation template:**

   ```bash
   npm run synth
   ```

5. **Deploy the stack:**

   ```bash
   npm run deploy
   ```

6. **View the outputs:**
   After deployment, you'll see outputs including:
   - SNS Topic ARN
   - SQS Queue URL
   - Dead Letter Queue URL
   - Lambda Function Name

## Project Structure

```
├── infra/                  # CDK infrastructure code (TypeScript)
│   ├── app.ts              # CDK app entry point
│   └── stacks/
│       └── worker-stack.ts # Main stack definition (SNS, SQS, Lambda, DLQ)
├── lib/                    # Compiled CDK infrastructure (auto-generated)
│   ├── app.js              # Compiled CDK app
│   └── stacks/
│       └── worker-stack.js # Compiled CDK stack
├── src/                    # Lambda source code (TypeScript)
│   └── lambda/
│       └── worker/
│           └── index.ts    # Lambda handler (bundled by esbuild)
├── test/                   # Unit tests
│   └── worker-stack.test.ts
├── cdk.json                # CDK configuration
├── tsconfig.json           # TypeScript config for infrastructure
├── tsconfig.eslint.json    # Extended config for linting all files
├── vitest.config.ts        # Vitest configuration
├── .eslintrc.json          # ESLint configuration
└── package.json            # Dependencies and scripts
```

## Available Commands

### Build & Deploy

- `npm run build` - Compile all TypeScript code to `lib/`
- `npm run watch` - Watch for TypeScript changes and recompile
- `npm run synth` - Synthesize CloudFormation template
- `npm run deploy` - Deploy stack to AWS
- `npm run diff` - Compare deployed stack with current state
- `npm run destroy` - Destroy the stack

### Testing

- `npm test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Linting

- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint errors automatically

## Lambda Function

The Lambda function (`src/lambda/worker/index.ts`) includes:

### Environment Variables:

- `QUEUE_URL` - SQS Queue URL
- `TOPIC_ARN` - SNS Topic ARN
- `DLQ_URL` - Dead Letter Queue URL
- `ENVIRONMENT` - Environment name (e.g., production, staging)
- `LOG_LEVEL` - Logging level (e.g., info, debug)

### Features:

- Processes messages in batches (up to 10)
- Handles partial batch failures
- Automatically retries failed messages
- Moves messages to DLQ after 3 failed attempts
- Comprehensive logging

## Testing

### Lambda Local Testing

Test your Lambda function locally without deploying to AWS:

```bash
# Quick interactive testing (recommended for development)
npm run test:lambda

# Run specific test scenario
npm run test:lambda simple      # Simple message
npm run test:lambda batch       # Batch processing
npm run test:lambda failure     # Error handling
```

For detailed local testing options, see **[LOCAL_TESTING.md](./LOCAL_TESTING.md)**

Available testing methods:

- 🚀 **Interactive Script** - Fast, multiple scenarios, no external deps
- ✅ **Vitest Unit Tests** - Automated testing with coverage
- 🐳 **AWS SAM CLI** - Most realistic, runs in Docker

### Unit Testing

This project uses **Vitest** for unit testing CDK constructs and Lambda functions.

### Running Tests

```bash
# Run all tests (CDK + Lambda)
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only Lambda function tests
npm test lambda-worker
```

### Test Structure

Unit tests are located in the `test/` directory. The example test (`test/worker-stack.test.ts`) validates:

- SNS topic creation and configuration
- SQS queue and DLQ setup
- Lambda function properties
- Environment variables
- Event source mappings
- IAM permissions
- CloudFormation outputs

### Writing New Tests

Create new test files with the `.test.ts` extension in the `test/` directory:

```typescript
import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WorkerStack } from "../lib/worker-stack";

describe("My Test Suite", () => {
  it("should test something", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Add your assertions here
  });
});
```

## Code Linting

This project uses **ESLint** with TypeScript support.

### Running Linter

```bash
# Check for linting errors
npm run lint

# Automatically fix linting errors
npm run lint:fix
```

### ESLint Configuration

The project is configured with:

- TypeScript ESLint plugin
- Recommended rules for Node.js and ES2021
- Custom rules in `.eslintrc.json`

## Integration Testing

### 1. Publish a message to SNS:

```bash
aws sns publish \
  --topic-arn <TOPIC_ARN_FROM_OUTPUT> \
  --message '{"test": "Hello from SNS"}'
```

### 2. Send a message directly to SQS:

```bash
aws sqs send-message \
  --queue-url <QUEUE_URL_FROM_OUTPUT> \
  --message-body '{"test": "Hello from SQS"}'
```

### 3. Check Lambda logs:

```bash
aws logs tail /aws/lambda/<FUNCTION_NAME> --follow
```

### 4. Monitor the DLQ (for failed messages):

```bash
aws sqs receive-message \
  --queue-url <DLQ_URL_FROM_OUTPUT> \
  --max-number-of-messages 10
```

## Customization

### Modify Lambda Function

Edit `src/lambda/worker/index.ts` to implement your business logic in the `processMessage` function. The Lambda code is written in TypeScript with proper type definitions from `@types/aws-lambda`.

After editing, compile with:

```bash
npm run build
```

### Update Environment Variables

Edit `infra/stacks/worker-stack.ts` to add or modify environment variables:

```typescript
environment: {
  QUEUE_URL: queue.queueUrl,
  TOPIC_ARN: topic.topicArn,
  // Add your custom variables here
  MY_CUSTOM_VAR: "value",
}
```

### Adjust Queue Configuration

Modify queue settings in `infra/stacks/worker-stack.ts`:

```typescript
const queue = new sqs.Queue(this, "WorkerQueue", {
  visibilityTimeout: cdk.Duration.seconds(300), // Adjust timeout
  receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
  deadLetterQueue: {
    queue: deadLetterQueue,
    maxReceiveCount: 3, // Change retry attempts
  },
});
```

### Change Lambda Settings

Adjust Lambda configuration in `infra/stacks/worker-stack.ts`:

```typescript
const workerFunction = new lambda.Function(this, "WorkerFunction", {
  runtime: lambda.Runtime.NODEJS_20_X,
  timeout: cdk.Duration.seconds(30), // Adjust timeout
  memorySize: 256, // Adjust memory
  // ... other settings
});
```

## Clean Up

To avoid incurring charges, destroy the stack when you're done:

```bash
npm run destroy
```

## Useful Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [AWS Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)
- [SNS to SQS Fanout](https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html)
- [SQS Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
