const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    // This function can be triggered by a DynamoDB Stream from the KycOcrData table
    const sessionId = event.Records[0].dynamodb.Keys.sessionId.S;
    console.log("KYCDecisionEngineLambda triggered for session:", sessionId);

    try {
        // LIVE AWS INTEGRATION: Fetch the real data from DynamoDB
        const ocrDataResult = await ddbClient.send(new GetItemCommand({
            TableName: process.env.OCR_TABLE_NAME, // 'KycOcrData'
            Key: { sessionId: { S: sessionId } },
        }));
        const sessionDataResult = await ddbClient.send(new GetItemCommand({
            TableName: process.env.SESSIONS_TABLE_NAME, // 'KycSessions'
            Key: { sessionId: { S: sessionId } },
        }));
        
        let finalStatus = "REJECTED";
        let reason = "Incomplete data.";

        // --- Your Business Logic Goes Here ---
        // This is where you would add more complex rules.
        if (ocrDataResult.Item && sessionDataResult.Item?.livenessCheckStatus?.S === 'SUCCESS') {
            finalStatus = "VERIFIED";
            reason = "All checks passed.";
        } else if (sessionDataResult.Item?.livenessCheckStatus?.S !== 'SUCCESS') {
            reason = "Liveness check failed or was not completed.";
        }
        // --- End of Business Logic ---

        const ddbParams = {
            TableName: process.env.RESULTS_TABLE_NAME, // 'KycResults'
            Item: {
                sessionId: { S: sessionId },
                finalStatus: { S: finalStatus },
                reason: { S: reason },
            },
        };
        await ddbClient.send(new PutItemCommand(ddbParams));

        // LIVE AWS INTEGRATION: Publish a notification to the SNS topic
        const snsParams = {
            TopicArn: process.env.SNS_TOPIC_ARN,
            Subject: `KYC Result for session ${sessionId}: ${finalStatus}`,
            Message: `The KYC process for session ${sessionId} has completed with a status of ${finalStatus}. Reason: ${reason}.`,
        };
        await snsClient.send(new PublishCommand(snsParams));

        console.log("Successfully processed and published final decision:", finalStatus);
    } catch (error) {
        console.error("Error in KYCDecisionEngineLambda:", error);
        throw error;
    }
};