const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto");

// Initialize the DynamoDB client. It will use the IAM role's permissions when on AWS.
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Get the data sent from the frontend in the request body
    const body = JSON.parse(event.body);
    const sessionId = `kyc-session-${crypto.randomUUID()}`;

    // Prepare the data structure to be saved in DynamoDB
    const params = {
      // LIVE AWS INTEGRATION: The table name is read from an environment variable
      TableName: process.env.TABLE_NAME, // e.g., 'KycSessions'
      Item: {
        sessionId: { S: sessionId },
        fileName: { S: body.fileName },
        documentType: { S: body.documentType },
        countryCode: { S: body.countryCode },
        status: { S: "UPLOAD_STARTED" },
        createdAt: { N: String(Date.now()) },
      },
    };

    // LIVE AWS INTEGRATION: This sends the actual command to the DynamoDB service
    await ddbClient.send(new PutItemCommand(params));

    // Return a success response to the frontend
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Session created successfully!",
        sessionId: sessionId,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to create session." }),
    };
  }
};
