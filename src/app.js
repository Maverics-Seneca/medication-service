const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const medicationRoutes = require('./routes/medicationRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register routes
app.use('/api/medications', medicationRoutes);

const PORT = 4500;
app.listen(PORT, () => console.log(`🚀 Medication Service running on port ${PORT}`));
