const express = require('express');
const app = express();
const PORT = 4002;

app.use(express.json());

// Mock Database for Medications
let medications = [
    { id: 1, userId: 1, name: "Paracetamol", dosage: "500mg", frequency: "Twice a day" },
    { id: 2, userId: 1, name: "Ibuprofen", dosage: "200mg", frequency: "Once a day" },
    { id: 3, userId: 2, name: "Aspirin", dosage: "100mg", frequency: "Once a day" }
];

// Create Medication (Add new medication)
app.post('/medications', (req, res) => {
    const { userId, name, dosage, frequency } = req.body;
    if (!userId || !name || !dosage || !frequency) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    const newMedication = {
        id: medications.length + 1,
        userId,
        name,
        dosage,
        frequency
    };
    
    medications.push(newMedication);
    res.status(201).json({ message: "Medication added successfully", medication: newMedication });
});

// Get All Medications
app.get('/medications', (req, res) => {
    res.json({ medications });
});

// Get Medications for a Specific User
app.get('/medications/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userMedications = medications.filter(med => med.userId === userId);

    if (userMedications.length === 0) {
        return res.status(404).json({ error: "No medications found for this user" });
    }

    res.json({ medications: userMedications });
});

// Get a Single Medication by ID
app.get('/medications/:id', (req, res) => {
    const medication = medications.find(med => med.id === parseInt(req.params.id));

    if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
    }

    res.json({ medication });
});

// Update Medication
app.put('/medications/:id', (req, res) => {
    const { name, dosage, frequency } = req.body;
    const medication = medications.find(med => med.id === parseInt(req.params.id));

    if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
    }

    if (name) medication.name = name;
    if (dosage) medication.dosage = dosage;
    if (frequency) medication.frequency = frequency;

    res.json({ message: "Medication updated successfully", medication });
});

// Delete Medication
app.delete('/medications/:id', (req, res) => {
    const medicationIndex = medications.findIndex(med => med.id === parseInt(req.params.id));

    if (medicationIndex === -1) {
        return res.status(404).json({ error: "Medication not found" });
    }

    const deletedMedication = medications.splice(medicationIndex, 1);
    res.json({ message: "Medication deleted successfully", medication: deletedMedication });
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ status: "Medication Service is running" });
});

app.listen(PORT, () => {
    console.log(`Medication Service running on port ${PORT}`);
});