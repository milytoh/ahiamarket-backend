class AdminLog {
    constructor(db) {
        this.collection = db.collection("admin-logs");
    }

    async createAdminLog(logData) {
        return await this.collection.createOne(logData)
    }
}


module.exports = AdminLog