import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WorkerStack } from "../infra/stacks/worker-stack.js";

describe("WorkerStack", () => {
  describe("Snapshot Tests", () => {
    it("should match the CloudFormation template snapshot", () => {
      const app = new cdk.App();
      const stack = new WorkerStack(app, "TestStack");
      const template = Template.fromStack(stack);

      // Snapshot the entire CloudFormation template
      expect(template.toJSON()).toMatchSnapshot();
    });

    it("should match the resource count snapshot", () => {
      const app = new cdk.App();
      const stack = new WorkerStack(app, "TestStack");
      const template = Template.fromStack(stack);

      const resources = template.toJSON().Resources;
      const resourceTypes = Object.entries(resources).reduce(
        (acc, [, resource]) => {
          const type = (resource as any).Type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Snapshot resource types and counts
      expect(resourceTypes).toMatchSnapshot();
    });

    it("should match the outputs snapshot", () => {
      const app = new cdk.App();
      const stack = new WorkerStack(app, "TestStack");
      const template = Template.fromStack(stack);

      // Snapshot all stack outputs
      expect(template.toJSON().Outputs).toMatchSnapshot();
    });
  });

  it("should create SNS topic with correct properties", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that SNS topic is created
    template.resourceCountIs("AWS::SNS::Topic", 1);

    template.hasResourceProperties("AWS::SNS::Topic", {
      DisplayName: "Worker Topic",
      TopicName: "worker-topic",
    });
  });

  it("should create SQS queue with DLQ configuration", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that 2 queues are created (main queue + DLQ)
    template.resourceCountIs("AWS::SQS::Queue", 2);

    // Check main queue properties
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "worker-queue",
      VisibilityTimeout: 300,
      ReceiveMessageWaitTimeSeconds: 20,
    });

    // Check DLQ properties
    template.hasResourceProperties("AWS::SQS::Queue", {
      QueueName: "worker-dlq",
      MessageRetentionPeriod: 1209600, // 14 days in seconds
    });
  });

  it("should create Lambda function with correct configuration", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that Lambda function is created
    template.resourceCountIs("AWS::Lambda::Function", 1);

    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs20.x",
      Handler: "index.handler",
      Timeout: 30,
      MemorySize: 256,
    });
  });

  it("should configure Lambda with environment variables", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check Lambda environment variables
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          ENVIRONMENT: "production",
          LOG_LEVEL: "info",
        },
      },
    });
  });

  it("should create SQS subscription to SNS topic", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that SNS subscription is created
    template.resourceCountIs("AWS::SNS::Subscription", 1);

    template.hasResourceProperties("AWS::SNS::Subscription", {
      Protocol: "sqs",
    });
  });

  it("should create Lambda event source mapping for SQS", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that event source mapping is created
    template.resourceCountIs("AWS::Lambda::EventSourceMapping", 1);

    template.hasResourceProperties("AWS::Lambda::EventSourceMapping", {
      BatchSize: 10,
      MaximumBatchingWindowInSeconds: 5,
      FunctionResponseTypes: ["ReportBatchItemFailures"],
    });
  });

  it("should create IAM role for Lambda with proper permissions", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that IAM role is created
    template.resourceCountIs("AWS::IAM::Role", 1);

    // Verify the role has Lambda service principal
    template.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
      },
    });
  });

  it("should create CloudFormation outputs", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Check that outputs are defined
    template.hasOutput("TopicArn", {});
    template.hasOutput("QueueUrl", {});
    template.hasOutput("DLQUrl", {});
    template.hasOutput("FunctionName", {});
  });

  it("should have appropriate resource count", () => {
    const app = new cdk.App();
    const stack = new WorkerStack(app, "TestStack");
    const template = Template.fromStack(stack);

    // Verify total resource counts
    const resources = template.toJSON().Resources;
    const resourceCount = Object.keys(resources).length;

    // Should have multiple resources (SNS, SQS, Lambda, IAM, etc.)
    expect(resourceCount).toBeGreaterThan(5);
  });
});
