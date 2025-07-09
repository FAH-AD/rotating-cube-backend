
import createFaceClient from '@azure-rest/ai-vision-face';
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.AZURE_FACE_ENDPOINT;
const key = process.env.AZURE_FACE_KEY;

const client = createFaceClient(endpoint, new AzureKeyCredential(key));

export default client;
