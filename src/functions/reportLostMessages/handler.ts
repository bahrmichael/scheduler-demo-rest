import 'source-map-support/register';
import {metricScope} from "aws-embedded-metrics";

import {DynamoDBStreamEvent} from "aws-lambda";

export const main = metricScope(metrics => async (event: DynamoDBStreamEvent) => {
  metrics.setNamespace("SchedulerDemo");
  const count = event.Records.length;
  metrics.putMetric("LostMessages", count, "Count");
});
