const express = require('express');
const { addMedication, getMedications, editMedication } = require('../controllers/medicationController');
const authenticateUser = require('../middlewares/authenticateUser');

const router = express.Router();

// Medication Routes
router.post('/add', authenticateUser, addMedication);
router.get('/', authenticateUser, getMedications);
router.put('/edit/:id', authenticateUser, editMedication);

module.exports = router;
