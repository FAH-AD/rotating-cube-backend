import express from 'express';
import { createConnection } from '../db/connection.js';
import {
  detectFace,
  identifyFace,
  createPerson,
  addPersonFace,
  trainPersonGroup
} from '../../faceHelpers.js';
import azureFaceClient from '../../azureClient.js';


const router = express.Router();

const db = await createConnection();

const PERSON_GROUP_ID = 'mfa-users';

// POST /api/enroll-face
router.post('/enroll-face', async (req, res) => {
  const { userId, faceImage } = req.body;
  if (!userId || !faceImage) return res.status(400).json({ error: 'Missing fields' });

  try {
    const [user] = await db.execute('SELECT * FROM mfa WHERE Id = ?', [userId]);
    if (!user.length) return res.status(404).json({ error: 'User not found' });

    const personId = await createPerson(azureFaceClient, PERSON_GROUP_ID, userId);
    await addPersonFace(PERSON_GROUP_ID, personId, faceImage);
    await trainPersonGroup(PERSON_GROUP_ID);
    console.log('personId:', personId);
    console.log('userId:', userId);

     if (!personId || !userId) {
  return res.status(400).json({ error: 'personId or userId is missing' });
}
    await db.execute('UPDATE mfa SET AzurePersonId = ? WHERE Id = ?', [personId, userId]);

    res.json({ message: 'Face enrolled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enroll face' });
  }
});

// POST /api/face-login
router.post('/face-login', async (req, res) => {
  const { faceImage } = req.body;
  if (!faceImage) return res.status(400).json({ error: 'Image required' });

  try {
    const faceId = await detectFace(faceImage);
    const personId = await identifyFace(faceId, PERSON_GROUP_ID);

    if (!personId) return res.status(401).json({ error: 'Face not recognized' });

    const [user] = await db.execute('SELECT * FROM mfa WHERE AzurePersonId = ?', [personId]);
    if (!user.length) return res.status(401).json({ error: 'User not found' });

    res.json({ message: 'Login successful', userId: user[0].Id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
