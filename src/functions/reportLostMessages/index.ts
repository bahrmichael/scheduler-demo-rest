export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {'Fn::GetAtt': ['MessagesTable', 'StreamArn']},
        filterPatterns: [{
          eventName: ['REMOVE'],
          dynamodb: {
            NewImage: {
              status: {
                'S': ['FRESH']
              }
            }
          }
        }]
      }
    }
  ],
}
