import client from './azureClient.js';

async function detectFace(imageUrl) {
  const res = await client.path('/face/v1.0/detect').post({
    body: { url: imageUrl },
    queryParameters: { returnFaceId: true },
    contentType: 'application/json',
  });
  return res.body?.[0]?.faceId;
}

async function identifyFace(faceId, groupId) {
  const res = await client.path('/face/v1.0/identify').post({
    body: {
      faceIds: [faceId],
      personGroupId: groupId,
      maxNumOfCandidatesReturned: 1,
      confidenceThreshold: 0.6,
    },
    contentType: 'application/json',
  });
  return res.body?.[0]?.candidates?.[0]?.personId;
}

async function createPerson(client, groupId, userId) {
  const res = await client
    .path('/face/v1.0/persongroups/{personGroupId}/persons', groupId)
    .post({
      body: { name: String(userId) },
      contentType: 'application/json',
    });

 console.log('Azure createPerson response:', res.status, res.body);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Azure returned status ${res.status}`);
  }

  return res.body?.personId;
}

async function addPersonFace(groupId, personId, imageUrl) {
  await client.path('/face/v1.0/persongroups/{groupId}/persons/{personId}/persistedFaces', groupId, personId).post({
    body: { url: imageUrl },
    contentType: 'application/json',
  });
}

async function trainPersonGroup(groupId) {
  await client.path('/face/v1.0/persongroups/{groupId}/train', groupId).post();
}

export {
  detectFace,
  identifyFace,
  createPerson,
  addPersonFace,
  trainPersonGroup,
};