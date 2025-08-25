// backend/kycDecisionEngine/index.js
const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const {
  RekognitionClient,
  CompareFacesCommand,
} = require("@aws-sdk/client-rekognition"); // New import

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
}); // New client

const SIMILARITY_THRESHOLD = 99.0; // Your business rule for minimum face match confidence

exports.handler = async (event) => {
  const sessionId = event.Records[0].dynamodb.Keys.sessionId.S;
  console.log("KYCDecisionEngineLambda triggered for session:", sessionId);

  try {
    // --- Step 1: Fetch all necessary data ---
    const ocrDataResult = await ddbClient.send(
      new GetItemCommand({
        TableName: process.env.OCR_TABLE_NAME,
        Key: { sessionId: { S: sessionId } },
      })
    );
    const sessionDataResult = await ddbClient.send(
      new GetItemCommand({
        TableName: process.env.SESSIONS_TABLE_NAME,
        Key: { sessionId: { S: sessionId } },
      })
    );

    const ocrData = ocrDataResult.Item;
    const sessionData = sessionDataResult.Item;

    // --- Step 2: Perform Face Comparison with Rekognition (New Step) ---
    let faceSimilarityScore = 0;
    if (sessionData?.livenessSelfie?.S && ocrData?.faceBoundingBox?.M) {
      const compareFacesParams = {
        SourceImage: {
          S3Object: {
            Bucket: process.env.UPLOAD_BUCKET,
            Name: sessionData.fileName.S,
          },
        },
        TargetImage: {
          S3Object: {
            Bucket: process.env.LIVENESS_BUCKET,
            Name: sessionData.livenessSelfie.S,
          },
        },
        SimilarityThreshold: SIMILARITY_THRESHOLD,
      };
      const compareFacesResponse = await rekognitionClient.send(
        new CompareFacesCommand(compareFacesParams)
      );
      if (compareFacesResponse.FaceMatches.length > 0) {
        faceSimilarityScore = compareFacesResponse.FaceMatches[0].Similarity;
      }
    }

    // --- Step 3: Apply Updated Business Logic ---
    let finalStatus = "REJECTED";
    let reason = "Incomplete data or checks failed.";

    if (faceSimilarityScore >= SIMILARITY_THRESHOLD) {
      finalStatus = "VERIFIED";
      reason = "All checks passed, face match confirmed.";
    } else {
      reason = `Face match failed with a similarity of ${faceSimilarityScore.toFixed(
        2
      )}%.`;
    }

    // --- Step 4 & 5: Save Result and Notify (Same as before, but with new result) ---
    const ddbParams = {
      TableName: process.env.RESULTS_TABLE_NAME,
      Item: {
        sessionId: { S: sessionId },
        finalStatus: { S: finalStatus },
        reason: { S: reason },
      },
    };
    await ddbClient.send(new PutItemCommand(ddbParams));

    const snsParams = {
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: `KYC Result: ${finalStatus}`,
      Message: `The KYC process for session ${sessionId} completed with status: ${finalStatus}. Reason: ${reason}.`,
    };
    await snsClient.send(new PublishCommand(snsParams));

    console.log("Successfully processed decision for session:", sessionId);
  } catch (error) {
    console.error("Error in KYCDecisionEngineLambda:", error);
    throw error;
  }
};
