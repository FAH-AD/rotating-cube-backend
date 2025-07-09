// createPersonGroup.js
const FaceClient = require('@azure-rest/ai-vision-face').default;
const { AzureKeyCredential } = require('@azure/core-auth');
require('dotenv').config();

const endpoint = process.env.AZURE_FACE_ENDPOINT;
const key = process.env.AZURE_FACE_KEY;
const personGroupId = 'mfa-users'; // must be lowercase, no spaces

const client = FaceClient(endpoint, new AzureKeyCredential(key));

(async () => {
  try {
    console.log(`⏳ Creating person group: ${personGroupId}`);

    await client
      .path('/face/v1.0/persongroups/{personGroupId}', personGroupId)
      .put({
        body: {
          name: 'MFA Users Group',
          recognitionModel: 'recognition_04',
        },
        contentType: 'application/json',
      });

    console.log(`✅ Person group '${personGroupId}' created successfully.`);
  } catch (err) {
    console.error('❌ Failed to create person group:', err.message);
  }
})();
