class Produc {
    constructor(db) {
        this.collection = db.collection('products')
    }

    async createProduct(productData) {
        return  await this.collection.insertOne(productData);
    }
}