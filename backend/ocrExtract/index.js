const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const {
  TextractClient,
  AnalyzeIDCommand,
} = require("@aws-sdk/client-textract");
const {
  RekognitionClient,
  DetectFacesCommand,
} = require("@aws-sdk/client-rekognition"); // New import

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const textractClient = new TextractClient({ region: process.env.AWS_REGION });
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
}); // New client

exports.handler = async (event) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  const sessionId = objectKey.split("/")[0];

  try {
    // --- Step 1: Analyze with Textract (Same as before) ---
    const textractParams = {
      DocumentPages: [{ S3Object: { Bucket: bucketName, Name: objectKey } }],
    };
    const textractResponse = await textractClient.send(
      new AnalyzeIDCommand(textractParams)
    );

    const extractedData = {};
    textractResponse.IdentityDocuments[0].IdentityDocumentFields.forEach(
      (field) => {
        const key = field.Type.Text.replace(/\s/g, "");
        if (key && field.ValueDetection) {
          extractedData[key] = { S: field.ValueDetection.Text };
        }
      }
    );

    // --- Step 2: Detect Face with Rekognition (New Step) ---
    const rekognitionParams = {
      Image: { S3Object: { Bucket: bucketName, Name: objectKey } },
    };
    const rekognitionResponse = await rekognitionClient.send(
      new DetectFacesCommand(rekognitionParams)
    );

    if (rekognitionResponse.FaceDetails.length !== 1) {
      throw new Error("Expected exactly one face to be detected on the ID.");
    }
    const faceBoundingBox = rekognitionResponse.FaceDetails[0].BoundingBox;

    // --- Step 3: Save Text AND Face Data to DynamoDB (Updated Step) ---
    const ddbParams = {
      TableName: process.env.OCR_TABLE_NAME, // e.g., 'KycOcrData'
      Item: {
        sessionId: { S: sessionId },
        ...extractedData,
        faceBoundingBox: {
          // New attribute to store face location
          M: {
            Width: { N: String(faceBoundingBox.Width) },
            Height: { N: String(faceBoundingBox.Height) },
            Left: { N: String(faceBoundingBox.Left) },
            Top: { N: String(faceBoundingBox.Top) },
          },
        },
        status: { S: "OCR_AND_FACE_DETECT_SUCCESSFUL" },
      },
    };
    await ddbClient.send(new PutItemCommand(ddbParams));

    console.log(
      "Successfully extracted text and detected face for session:",
      sessionId
    );
  } catch (error) {
    console.error("Error in OCRExtractLambda:", error);
    throw error;
  }
};
