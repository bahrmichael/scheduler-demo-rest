import 'source-map-support/register';
import axios from 'axios';

import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import {metricScope} from "aws-embedded-metrics";

const ddb = new DynamoDB.DocumentClient();

const {API_KEY, APP_ID, MESSAGES_TABLE, MESSAGES_PER_MINUTE, SCHEDULER_ENDPOINT} = process.env;

const scheduler = axios.create({
  baseURL: SCHEDULER_ENDPOINT,
  timeout: 6_000,
});

const MINUTE = 60;
const MAX_MESSAGES_PER_MINUTE = 500;

export const main = metricScope(metrics => async () => {

  if (!API_KEY || !APP_ID) {
    console.log('Missing API key or Application ID. Aborting.');
    return;
  }

  // Allow up to 500 messages per minute. Beyond that we run into risk of timing out.
  // Feel free to adjust if you know what you're doing.
  const messageCount = Math.min(+MESSAGES_PER_MINUTE, MAX_MESSAGES_PER_MINUTE);

  for (let i = 0; i < messageCount; i++) {

    // Generate a delay of up to 30 minutes
    const delayInSeconds = Math.random() * 30 * MINUTE;

    // Build a message with the delay and a random payload
    const message = {
      payload: {
        scheduledAt: `${new Date().getTime()}`
      },
      sendAt: dateWithDelay(delayInSeconds).toISOString(),
    };

    // Store the message so that we can verify it later
    await ddb.put({
      TableName: MESSAGES_TABLE,
      Item: {
        pk: message.payload.scheduledAt,
        ...message,
        status: 'FRESH',
        // Clean up messages after 60 minutes
        timeToLive: dateWithDelay(60 * MINUTE),
      },
    }).promise();

    // Encode the APP_ID and API_KEY to set the Authorization header
    const headers = {
      Authorization: `Basic ${base64EncodeAuth(APP_ID, API_KEY)}`,
    };

    // Send the message to the scheduler
    await scheduler.post(`/message`, message, {headers});

    console.log('Scheduled message', message);
  }

  metrics.setNamespace("SchedulerDemo");
  metrics.putMetric("SentMessages", messageCount, "Count");
});

function base64EncodeAuth(appId: any, apiKey: any) {
  const data = `${appId}:${apiKey}`;
  const buff = Buffer.from(data);
  return buff.toString('base64');
}

function dateWithDelay(delaySeconds: number): Date {
  return new Date(new Date().getTime() + 1000 * delaySeconds);
}