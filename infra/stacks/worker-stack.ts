import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS Topic
    const topic = new sns.Topic(this, "WorkerTopic", {
      displayName: "Worker Topic",
      topicName: "worker-topic",
    });

    // Create Dead Letter Queue
    const deadLetterQueue = new sqs.Queue(this, "WorkerDLQ", {
      queueName: "worker-dlq",
      retentionPeriod: cdk.Duration.days(14),
    });

    // Create Main SQS Queue with DLQ
    const queue = new sqs.Queue(this, "WorkerQueue", {
      queueName: "worker-queue",
      visibilityTimeout: cdk.Duration.seconds(300),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3, // Move to DLQ after 3 failed attempts
      },
    });

    // Subscribe SQS Queue to SNS Topic
    topic.addSubscription(new snsSubscriptions.SqsSubscription(queue));

    // Create Lambda Function with esbuild bundling
    const workerFunction = new NodejsFunction(this, "WorkerFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: join(__dirname, "../../src/lambda/worker/index.ts"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      bundling: {
        minify: true,
        sourceMap: true,
        target: "es2022",
        format: OutputFormat.ESM,
        banner:
          '{"js":"import { createRequire } from \'module\';const require = createRequire(import.meta.url);"}',
        esbuildArgs: {
          "--tree-shaking": "true",
        },
      },
      environment: {
        QUEUE_URL: queue.queueUrl,
        TOPIC_ARN: topic.topicArn,
        DLQ_URL: deadLetterQueue.queueUrl,
        ENVIRONMENT: "production",
        LOG_LEVEL: "info",
      },
    });

    // Add SQS as event source for Lambda
    workerFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        reportBatchItemFailures: true,
      })
    );

    // Grant permissions
    queue.grantConsumeMessages(workerFunction);
    topic.grantPublish(workerFunction);
    deadLetterQueue.grantSendMessages(workerFunction);

    // Output the resource ARNs/URLs
    new cdk.CfnOutput(this, "TopicArn", {
      value: topic.topicArn,
      description: "SNS Topic ARN",
    });

    new cdk.CfnOutput(this, "QueueUrl", {
      value: queue.queueUrl,
      description: "SQS Queue URL",
    });

    new cdk.CfnOutput(this, "DLQUrl", {
      value: deadLetterQueue.queueUrl,
      description: "Dead Letter Queue URL",
    });

    new cdk.CfnOutput(this, "FunctionName", {
      value: workerFunction.functionName,
      description: "Lambda Function Name",
    });
  }
}
