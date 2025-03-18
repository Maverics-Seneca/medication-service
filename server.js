// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({ origin: 'http://middleware:3001', credentials: true }));
app.use(bodyParser.json());

// Constants
const PORT = process.env.PORT || 4002;

// Utility Functions

/**
 * Logs changes to Firestore for auditing purposes.
 * @param {string} action - The action performed (e.g., CREATE, UPDATE, DELETE).
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} entity - The entity being modified (e.g., 'Medication').
 * @param {string} entityId - The ID of the entity being modified.
 * @param {string} entityName - The name of the entity being modified.
 * @param {object} details - Additional details about the change.
 */
async function logChange(action, userId, entity, entityId, entityName, details = {}) {
    try {
        let userName = 'Unknown';
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) userName = userDoc.data().name || 'Unnamed User';

        const logEntry = {
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            action,
            userId: userId || 'unknown',
            userName,
            entity,
            entityId,
            entityName: entityName || 'N/A',
            details,
        };
        await db.collection('logs').add(logEntry);
        console.log(`Logged: ${action} on ${entity} (${entityId}, ${entityName}) by ${userId} (${userName})`);
    } catch (error) {
        console.error('Error logging change:', error);
    }
}

// API Endpoints

/**
 * Add a new medication.
 * @route POST /api/medicine/add
 * @param {string} patientId - The ID of the patient associated with the medication.
 * @param {string} name - The name of the medication.
 * @param {string} dosage - The dosage of the medication.
 * @param {string} frequency - The frequency of the medication.
 * @param {string} prescribingDoctor - The doctor who prescribed the medication.
 * @param {string} endDate - The end date of the medication.
 * @param {number} inventory - The inventory count of the medication.
 * @param {string} organizationId - The ID of the organization (optional).
 */
app.post('/api/medicine/add', async (req, res) => {
    if (!req.body) return res.status(400).json({ error: 'Request body is missing' });

    const { patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory, organizationId } = req.body;

    // Input validation
    if (!patientId || !name || !dosage || !frequency || !prescribingDoctor || !endDate || inventory === undefined) {
        console.error('Missing required fields:', { patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory, organizationId });
        return res.status(400).json({ error: 'All fields are required except organizationId' });
    }

    if (!Number.isInteger(inventory) || inventory < 0) {
        console.error('Invalid inventory:', inventory);
        return res.status(400).json({ error: 'Inventory must be a non-negative integer' });
    }

    console.log('Received request body:', req.body); // Log the full request body

    try {
        const medicineData = {
            patientId,
            name,
            dosage,
            frequency,
            prescribingDoctor,
            endDate,
            inventory,
            organizationId: organizationId || null, // Explicitly include organizationId
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        console.log('Data to be stored in Firestore:', medicineData); // Log before storing

        const medicineRef = await db.collection('medications').add(medicineData);
        await logChange('CREATE', patientId, 'Medication', medicineRef.id, name, { data: req.body });
        console.log('Medicine added with ID:', medicineRef.id);
        res.json({ message: 'Medicine added successfully', id: medicineRef.id });
    } catch (error) {
        console.error('Error adding medicine:', error.message);
        res.status(500).json({ error: 'Failed to add medicine', details: error.message });
    }
});

/**
 * Get current medications for a specific patient.
 * @route GET /api/medicine/get
 * @param {string} patientId - The ID of the patient to fetch medications for.
 */
app.get('/api/medicine/get', async (req, res) => {
    const { patientId } = req.query;

    // Input validation
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    try {
        const currentDate = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('medications')
            .where('patientId', '==', patientId)
            .where('endDate', '>=', currentDate)
            .get();

        if (snapshot.empty) {
            console.log('No valid medications found for patientId:', patientId);
            return res.json([]);
        }

        const medications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Valid medications retrieved:', medications);
        res.json(medications);
    } catch (error) {
        console.error('Error fetching medications:', error.message);
        res.status(500).json({ error: 'Failed to fetch medications', details: error.message });
    }
});

/**
 * Get expired medications for a specific patient.
 * @route GET /api/medicine/history
 * @param {string} patientId - The ID of the patient to fetch expired medications for.
 */
app.get('/api/medicine/history', async (req, res) => {
    const { patientId } = req.query;

    // Input validation
    if (!patientId) return res.status(400).json({ error: 'patientId is required' });

    try {
        const currentDate = new Date().toISOString().split('T')[0];
        const snapshot = await db.collection('medications')
            .where('patientId', '==', patientId)
            .where('endDate', '<', currentDate)
            .get();

        if (snapshot.empty) {
            console.log('No expired medications found for patientId:', patientId);
            return res.json([]);
        }

        const medications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Expired medications retrieved:', medications);
        res.json(medications);
    } catch (error) {
        console.error('Error fetching medication history:', error.message);
        res.status(500).json({ error: 'Failed to fetch medication history', details: error.message });
    }
});

/**
 * Update a medication's details.
 * @route POST /api/medicine/update
 * @param {string} id - The ID of the medication to update.
 * @param {string} patientId - The ID of the patient associated with the medication.
 * @param {string} name - The updated name of the medication.
 * @param {string} dosage - The updated dosage of the medication.
 * @param {string} frequency - The updated frequency of the medication.
 * @param {string} prescribingDoctor - The updated prescribing doctor.
 * @param {string} endDate - The updated end date of the medication.
 * @param {number} inventory - The updated inventory count of the medication.
 */
app.post('/api/medicine/update', async (req, res) => {
    const { id, patientId, name, dosage, frequency, prescribingDoctor, endDate, inventory } = req.body;

    // Input validation
    if (!id || !patientId) return res.status(400).json({ error: 'id and patientId are required' });

    try {
        const medicineRef = db.collection('medications').doc(id);
        const doc = await medicineRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Medicine not found' });
        const medicineData = doc.data();
        if (medicineData.patientId !== patientId) return res.status(403).json({ error: 'Unauthorized' });

        await medicineRef.update({
            name,
            dosage,
            frequency,
            prescribingDoctor,
            endDate,
            inventory,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await logChange('UPDATE', patientId, 'Medication', id, name, { oldData: medicineData, newData: req.body });
        console.log('Medicine updated:', id);
        res.json({ message: 'Medicine updated successfully' });
    } catch (error) {
        console.error('Error updating medicine:', error.message);
        res.status(500).json({ error: 'Failed to update medicine', details: error.message });
    }
});

/**
 * Delete a medication.
 * @route DELETE /api/medicine/delete
 * @param {string} id - The ID of the medication to delete.
 * @param {string} patientId - The ID of the patient associated with the medication.
 */
app.delete('/api/medicine/delete', async (req, res) => {
    const { id, patientId } = req.body;

    // Input validation
    if (!id || !patientId) return res.status(400).json({ error: 'id and patientId are required' });

    try {
        const medicineRef = db.collection('medications').doc(id);
        const doc = await medicineRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Medicine not found' });
        const medicineData = doc.data();
        if (medicineData.patientId !== patientId) return res.status(403).json({ error: 'Unauthorized' });

        await logChange('DELETE', patientId, 'Medication', id, medicineData.name, { data: medicineData });
        await medicineRef.delete();
        console.log('Medicine deleted:', id);
        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Error deleting medicine:', error.message);
        res.status(500).json({ error: 'Failed to delete medicine', details: error.message });
    }
});

/**
 * Get all current medications for an organization.
 * @route GET /api/medications/all
 * @param {string} organizationId - The ID of the organization to fetch medications for.
 */
app.get('/api/medications/all', async (req, res) => {
    const { organizationId } = req.query;

    // Input validation
    if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

    try {
        const patientsSnapshot = await db.collection('users')
            .where('organizationId', '==', organizationId)
            .where('role', '==', 'user')
            .get();
        const patientIds = patientsSnapshot.docs.map(doc => doc.id);

        const currentDate = new Date().toISOString().split('T')[0];
        const medicationsSnapshot = await db.collection('medications')
            .where('patientId', 'in', patientIds.length > 0 ? patientIds : ['none'])
            .where('endDate', '>=', currentDate)
            .get();

        if (medicationsSnapshot.empty) {
            console.log('No current medications found for organizationId:', organizationId);
            return res.json([]);
        }

        const medications = medicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('All current medications retrieved:', medications);
        res.json(medications);
    } catch (error) {
        console.error('Error fetching all medications:', error.message);
        res.status(500).json({ error: 'Failed to fetch medications', details: error.message });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Medication Service running on port ${PORT}`));