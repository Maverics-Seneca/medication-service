require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors'); // Import cors
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(express.json());


// Middleware
app.use(cors({
    origin: 'http://middleware:3001', // Allow requests from middleware
    credentials: true, // Allow cookies to be sent
}));

// Add a new medicine
app.post('/api/medicine/add', async (req, res) => {

    if (!req.body) {
        console.error('Request body is undefined');
        return res.status(400).json({ error: 'Request body is missing' });
    }

    const { patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory } = req.body;

    if (!patientId || !name || !dosage || !frequency || !prescribingDoctor || !endDate || inventory === undefined) {
        console.error('Missing required fields:', { patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory });
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!Number.isInteger(inventory) || inventory < 0) {
        console.error('Invalid inventory:', inventory);
        return res.status(400).json({ error: 'Inventory must be a non-negative integer' });
    }

    try {
        const medicineRef = await db.collection('medications').add({
            patientId,
            name,
            dosage,
            frequency,
            prescribingDoctor,
            endDate,
            inventory,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('Medicine added with ID:', medicineRef.id);
        res.json({ message: 'Medicine added successfully', id: medicineRef.id });
    } catch (error) {
        console.error('Error adding medicine to Firebase:', error);
        res.status(500).json({ error: 'Failed to add medicine', details: error.message });
    }
});

// Start the server
const PORT = 4002;
app.listen(PORT, () => {
    console.log(`Medication service running on port ${PORT}`);
});