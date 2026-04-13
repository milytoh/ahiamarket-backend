class AdminLog {
    constructor(db) {
        this.collection = db.collection("admin-logs");
    }

    async createAdminLog(logData) {
        return await this.collection.insertOne(logData)
    }
}


module.exports = AdminLog