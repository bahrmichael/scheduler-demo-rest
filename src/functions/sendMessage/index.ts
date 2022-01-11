export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      schedule: 'rate(1 minute)'
    }
  ],
  environment: {
    MESSAGES_TABLE: {Ref: 'MessagesTable'},
    API_KEY: '${env:API_KEY}',
    APP_ID: '${env:APP_ID}',
    SCHEDULER_ENDPOINT: '${env:SCHEDULER_ENDPOINT, "https://api.point-in-time-scheduler.com"}',
    // Without the env var set, the demo will send 1 message per minute. You can raise it up to 500 per minute.
    // Note that 500 requests per minute will consume your daily quota of 10,000 requests in 20 minutes.
    MESSAGES_PER_MINUTE: '${env:MESSAGES_PER_MINUTE, "1"}',
  },
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem'],
      Resource: {'Fn::GetAtt': ['MessagesTable', 'Arn']}
    },
  ],
  timeout: 60,
}
