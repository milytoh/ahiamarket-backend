class Payment {
    constructor(db) {
        this.collection = db.collection("payments")
    }

    async createPayment(paymentData, session) {
        return await this.collection.insertOne(paymentData, {session});
    }
}


module.exports = Payment;