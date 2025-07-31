class User {
  constructor(db) {
    this.collection = db.collection("users");
  }

  async signup(userData) {
    const user = await this.collection.insertOne(userData);

    return user;
  }

  async findAllUsers() {
    const users = await this.collection.find().toArray();
    return users;
  }

  async findUserById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async findUserByEmail(email) {
    return await this.collection.findOne({ email: email });
  }

  async updateUser(userId, data) {
    return await this.collection.updateOne(
      { _id: userId },
      {
        $set: data,
      }
    );
  }
}

module.exports = User;
