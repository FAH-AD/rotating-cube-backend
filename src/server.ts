import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dataRoutes from './routes/data';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Use the data routes
app.use(dataRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
