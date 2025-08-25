const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  // NOTE: In the real app, the frontend would pass the 'kycSessionId' from the previous step
  const { kycSessionId } = JSON.parse(event.body);
  const livenessSessionId = crypto.randomUUID(); // This is for logging/tracking

  try {
    const params = {
      // LIVE AWS INTEGRATION: The table name is read from an environment variable
      TableName: process.env.TABLE_NAME, // e.g., 'KycSessions'
      Key: { sessionId: { S: kycSessionId } },
      UpdateExpression:
        "SET #status = :status, livenessSessionId = :livenessId",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": { S: "LIVENESS_STARTED" },
        ":livenessId": { S: livenessSessionId },
      },
    };

    // LIVE AWS INTEGRATION: This sends the update command to DynamoDB
    await ddbClient.send(new UpdateItemCommand(params));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ sessionId: livenessSessionId }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to start liveness session." }),
    };
  }
};
