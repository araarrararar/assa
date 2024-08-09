const AWS = require("aws-sdk");

// AWS Configuration
if (process.env.STAGE === "local") {
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  console.log(process.env.STAGE);
} else {
  AWS.config.update({
    region: process.env.AWS_REGION,
  });
  console.log(process.env.STAGE, "Stage");

}

const cloudwatchlogs = new AWS.CloudWatchLogs();

export default async function DumpCloudWatchLogs(sessionId, logs) {
  try {
    const logGroupName = process.env.LOG_GROUP_NAME;
    const logStreamName = sessionId; // Assuming sessionId is the log stream name

    // Ensure log stream exists
    await cloudwatchlogs
      .createLogStream({ logGroupName, logStreamName })
      .promise();
    console.log(`Log stream ${logStreamName} created.`);

    // Construct log events array
    const logEvents = [
      {
        message: logs,
        timestamp: Date.now(),
      },
    ];

    // Put log events
    const params = {
      logEvents,
      logGroupName,
      logStreamName,
    };
    await cloudwatchlogs.putLogEvents(params).promise();
  } catch (error) {
    if (error.code !== "ResourceAlreadyExistsException") {
      console.error("Error creating log stream:", error);
    }
  }
}
