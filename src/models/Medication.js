class Medication {
    constructor(userId, medicineName, dosage, inventory, endDate) {
        this.userId = userId;
        this.medicineName = medicineName;
        this.dosage = dosage;
        this.inventory = inventory;
        this.endDate = endDate;
        this.createdAt = new Date();
    }
}

module.exports = Medication;
