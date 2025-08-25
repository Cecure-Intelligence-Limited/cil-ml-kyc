const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const {
  TextractClient,
  AnalyzeIDCommand,
} = require("@aws-sdk/client-textract");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const textractClient = new TextractClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  // Get the bucket and file name from the S3 trigger event
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const sessionId = objectKey.split("/")[0];

  try {
    // LIVE AWS INTEGRATION: This prepares and sends the command to Textract
    const textractParams = {
      DocumentPages: [{ S3Object: { Bucket: bucketName, Name: objectKey } }],
    };
    const textractResponse = await textractClient.send(
      new AnalyzeIDCommand(textractParams)
    );

    // This replaces the simulated data. We now parse the REAL response.
    const extractedData = {};
    textractResponse.IdentityDocuments[0].IdentityDocumentFields.forEach(
      (field) => {
        const key = field.Type.Text.replace(/\s/g, "");
        if (key && field.ValueDetection) {
          extractedData[key] = { S: field.ValueDetection.Text };
        }
      }
    );

    const ddbParams = {
      // LIVE AWS INTEGRATION: The table name is read from an environment variable
      TableName: process.env.OCR_TABLE_NAME, // e.g., 'KycOcrData'
      Item: {
        sessionId: { S: sessionId },
        ...extractedData,
        status: { S: "OCR_SUCCESSFUL" },
      },
    };

    // LIVE AWS INTEGRATION: This saves the real, parsed data to DynamoDB
    await ddbClient.send(new PutItemCommand(ddbParams));

    console.log(
      "Successfully extracted and saved OCR data for session:",
      sessionId
    );
  } catch (error) {
    console.error("Error in OCRExtractLambda:", error);
    throw error; // Let AWS handle the retry logic for failed background tasks
  }
};
