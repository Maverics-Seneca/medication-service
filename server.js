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

// medication-service
app.get('/api/medicine/get', async (req, res) => {
    const { patientId } = req.query;

    if (!patientId) {
        return res.status(400).json({ error: 'patientId is required' });
    }

    try {
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // e.g., "2025-03-10"
        console.log('Fetching medications with endDate >=', formattedCurrentDate);
        const snapshot = await db.collection('medications')
            .where('patientId', '==', patientId)
            .where('endDate', '>', formattedCurrentDate) // Filter for non-expired medications
            .get();

        if (snapshot.empty) {
            console.log('No valid medications found for patientId:', patientId);
            return res.json([]);
        }

        const medications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Valid medications retrieved:', medications);
        res.json(medications);
    } catch (error) {
        console.error('Error fetching medications from Firebase:', error);
        res.status(500).json({
            error: 'Failed to fetch medications',
            details: error.message,
            code: error.code // Optional: Firebase-specific error code
        });
    }
});

app.get('/api/medicine/history', async (req, res) => {
    const { patientId } = req.query;

    if (!patientId) {
        return res.status(400).json({ error: 'patientId is required' });
    }

    try {
        const currentDate = new Date();
        const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // e.g., "2025-03-10"
        const snapshot = await db.collection('medications')
            .where('patientId', '==', patientId)
            .where('endDate', '<', formattedCurrentDate) // Filter for expired medications
            .get();

        if (snapshot.empty) {
            console.log('No expired medications found for patientId:', patientId);
            return res.json([]);
        }

        const medications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Expired medications retrieved:', medications);
        res.json(medications);
    } catch (error) {
        console.error('Error fetching medication history from Firebase:', error);
        res.status(500).json({
            error: 'Failed to fetch medication history',
            details: error.message,
            code: error.code
        });
    }
});

// Update a medicine
app.post('/api/medicine/update', async (req, res) => {
    const { id, patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory } = req.body;

    if (!id || !patientId) {
        return res.status(400).json({ error: 'id and patientId are required' });
    }

    try {
        const medicineRef = db.collection('medications').doc(id);
        const doc = await medicineRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        const medicineData = doc.data();
        if (medicineData.patientId !== patientId) {
            return res.status(403).json({ error: 'Unauthorized to update this medicine' });
        }

        await medicineRef.update({
            name,
            dosage,
            frequency,
            prescribingDoctor,
            endDate,
            inventory,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('Medicine updated successfully:', { id });
        res.json({ message: 'Medicine updated successfully' });
    } catch (error) {
        console.error('Error updating medicine in Firebase:', error);
        res.status(500).json({ error: 'Failed to update medicine', details: error.message });
    }
});

// Delete a medicine
app.delete('/api/medicine/delete', async (req, res) => {
    const { id, patientId } = req.body;

    if (!id || !patientId) {
        return res.status(400).json({ error: 'id and patientId are required' });
    }

    try {
        const medicineRef = db.collection('medications').doc(id);
        const doc = await medicineRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Medicine not found' });
        }

        const medicineData = doc.data();
        if (medicineData.patientId !== patientId) {
            return res.status(403).json({ error: 'Unauthorized to delete this medicine' });
        }

        await medicineRef.delete();

        console.log('Medicine deleted successfully:', { id });
        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Error deleting medicine from Firebase:', error);
        res.status(500).json({ error: 'Failed to delete medicine', details: error.message });
    }
});

// Start the server
const PORT = 4002;
app.listen(PORT, () => {
    console.log(`Medication service running on port ${PORT}`);
});