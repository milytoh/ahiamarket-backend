class Payment {
    constructor(db) {
        this.collection = db.collection("payments")
    }

    async createPayment(paymentData) {
        return await this.collection.insertOne(paymentData);
    }
}


module.exports = Payment;