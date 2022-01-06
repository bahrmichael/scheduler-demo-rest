import 'source-map-support/register';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {metricScope} from "aws-embedded-metrics";

import {APIGatewayProxyEventBase} from "aws-lambda";

const ddb = new DynamoDB.DocumentClient();

const {MESSAGES_TABLE} = process.env;

async function setMessageReceived(payload: string): Promise<void> {
  await ddb.update({
    TableName: MESSAGES_TABLE,
    Key: {
      payload,
    },
    UpdateExpression: 'set #status = :s',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':s': 'RECEIVED'
    }
  }).promise();
}

async function getMessage(payload: string): Promise<any> {
  return (await ddb.get({
    TableName: MESSAGES_TABLE,
    Key: {payload}
  }).promise()).Item;
}

export const main = metricScope(metrics => async (event: APIGatewayProxyEventBase<any>) => {

  metrics.setNamespace("SchedulerDemo");
  metrics.putMetric("ReceiveMessages", 1, "Count");

  // The endpoint is authorized via an x-api-key header that is required by ApiGateway
  // index.ts => private: true
  // serverless.ts => apiKeys: ["API_KEY"]
  // The serverless framework will print the key on the console after deployment, unless you hide it with `--conceal`.

  const {body} = event;

  console.log('Received event', body);

  const {payload} = JSON.parse(body);

  // Record metrics about how late the message was.
  const {sendAt: expectedArrival} = await getMessage(payload);
  const arrivalDelay = new Date().getTime() - new Date(expectedArrival).getTime();
  metrics.putMetric("ArrivalDelay", arrivalDelay, "Milliseconds");

  // Mark the message as received, for later metrics about lost messages.
  await setMessageReceived(payload);

  return {
    statusCode: 200,
    body: '',
  };
});
