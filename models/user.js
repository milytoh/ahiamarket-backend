


class User {
  constructor(db) {
    this.collection = db.collection("users");
  }

  async signup(userData) {
    const user = await this.collection.insertOne(userData);

    return user;
  }

  async findUserById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async findUserByEmail(email) {
    return await this.collection.findOne({ email: email });
  }
}

module.exports = User;
