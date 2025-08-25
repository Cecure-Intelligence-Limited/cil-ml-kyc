const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const sessionId = event.pathParameters.sessionId;

    const params = {
      // LIVE AWS INTEGRATION: The table name is read from an environment variable
      TableName: process.env.TABLE_NAME, // e.g., 'KycResults'
      Key: { sessionId: { S: sessionId } },
    };

    // LIVE AWS INTEGRATION: This sends the command to get the item from DynamoDB
    const { Item } = await ddbClient.send(new GetItemCommand(params));

    // If no final result is found, the process is still pending
    if (!Item) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ status: "PENDING" }),
      };
    }

    // A final result was found, return its status
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ status: Item.finalStatus.S }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch KYC status." }),
    };
  }
};
