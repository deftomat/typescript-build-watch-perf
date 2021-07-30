import {
  aws_dynamodb,
  aws_elasticsearch,
  aws_lambda,
  aws_sqs,
  Duration,
  Environment,
  SecretValue,
  Stack,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface ApiStackProps {
  readonly env: Environment;
  readonly coreNlpRunner: aws_lambda.Function;
  readonly spacyRunner: aws_lambda.Function;
}

const stage = 'dev';

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, {
      description: 'Graphql API',
      terminationProtection: false,
      env: props.env,
      tags: { stage },
    });

    const stack = this;

    const dynamo = new aws_dynamodb.Table(stack, 'Table', {
      partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'entity', type: aws_dynamodb.AttributeType.STRING },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    const dynamoReverseIndexName = 'entity-id';
    dynamo.addGlobalSecondaryIndex({
      indexName: dynamoReverseIndexName,
      partitionKey: { name: 'entity', type: aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
    });

    const elasticsearchUserName = 'root';
    const elasticsearchPassword = SecretValue.secretsManager('elasticsearchPassword');

    const elasticsearch = new aws_elasticsearch.Domain(stack, 'EsDomain', {
      version: aws_elasticsearch.ElasticsearchVersion.V7_10,
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: { enabled: true },
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.elasticsearch',
      },
      useUnsignedBasicAuth: true,
      fineGrainedAccessControl: {
        masterUserName: elasticsearchUserName,
        masterUserPassword: elasticsearchPassword,
      },
    });

    const sqs = new aws_sqs.Queue(stack, 'Sqs', {
      visibilityTimeout: Duration.seconds(75),
    });
  }
}
