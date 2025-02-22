const express = require('express');
const app = express();
const PORT = 4002;

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Medication Service running on port ${PORT}`);
});