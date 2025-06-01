const cors = require('cors');
const express = require('express');
const dataRoutes = require('./src/routes/data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Use the data routes
app.use(dataRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});