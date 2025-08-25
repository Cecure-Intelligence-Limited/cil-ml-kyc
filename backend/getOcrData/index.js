const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    // Get the unique session ID from the URL path (e.g., /v1/ocr-data/some-id)
    const sessionId = event.pathParameters.sessionId;

    const params = {
      // LIVE AWS INTEGRATION: The table name is read from an environment variable
      TableName: process.env.TABLE_NAME, // e.g., 'KycOcrData'
      Key: { sessionId: { S: sessionId } },
    };

    // LIVE AWS INTEGRATION: This sends the command to get the item from DynamoDB
    const { Item } = await ddbClient.send(new GetItemCommand(params));

    if (!Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Data not found." }),
      };
    }

    // Convert the complex DynamoDB format to a simple JSON object for the frontend
    const extractedData = Object.keys(Item).reduce((acc, key) => {
      acc[key] = Object.values(Item[key])[0];
      return acc;
    }, {});

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(extractedData),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch OCR data." }),
    };
  }
};
