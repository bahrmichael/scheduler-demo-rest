import type { AWS } from '@serverless/typescript';

import {sendMessage, receiveMessage, reportLostMessages} from './src/functions';

const serverlessConfiguration: AWS = {
  service: 'scheduler-demo-rest',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    },
    logRetentionInDays: 14
  },
  plugins: ['serverless-webpack', 'serverless-iam-roles-per-function', 'serverless-plugin-log-retention'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    stage: '${env:STAGE, "dev"}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: ["SCHEDULER_DEMO_API_KEY_${env:STAGE, \"dev\"}"],
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
    lambdaHashingVersion: '20201221',
  },
  functions: { sendMessage, receiveMessage, reportLostMessages },
  resources: {
    Resources: {
      MessagesTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'pk',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'pk',
            AttributeType: 'S'
          }],
          TimeToLiveSpecification: {
            AttributeName: 'timeToLive',
            Enabled: true,
          },
          StreamSpecification: {
            StreamViewType: 'NEW_IMAGE'
          },
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
