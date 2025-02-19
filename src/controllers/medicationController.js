const { db } = require('../config/firebase');
const Medication = require('../models/Medication');

/**
 * Add a new medication
 */
exports.addMedication = async (req, res) => {
    const { medicineName, dosage, inventory, endDate } = req.body;

    if (!medicineName || !dosage || inventory === undefined || !endDate) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const medication = new Medication(req.userId, medicineName, dosage, inventory, endDate);
        const medRef = await db.collection('medications').add({ ...medication });

        res.status(201).json({ message: "Medication added successfully", medId: medRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetch all medications for the logged-in user
 */
exports.getMedications = async (req, res) => {
    try {
        const medicationsSnapshot = await db.collection('medications')
            .where('userId', '==', req.userId)
            .get();

        if (medicationsSnapshot.empty) {
            return res.status(200).json({ medications: [] });
        }

        let medications = [];
        medicationsSnapshot.forEach(doc => {
            medications.push({ id: doc.id, ...doc.data() });
        });

        res.json({ medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Edit a medication entry
 */
exports.editMedication = async (req, res) => {
    const medId = req.params.id;
    const { medicineName, dosage, inventory, endDate } = req.body;

    if (!medicineName && !dosage && inventory === undefined && !endDate) {
        return res.status(400).json({ message: "At least one field is required for update" });
    }

    try {
        const medRef = db.collection('medications').doc(medId);
        const medDoc = await medRef.get();

        if (!medDoc.exists) {
            return res.status(404).json({ message: "Medication not found" });
        }

        await medRef.update({ medicineName, dosage, inventory, endDate });

        res.json({ message: "Medication updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
