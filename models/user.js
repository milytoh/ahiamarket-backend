class User {
  constructor(db) {
    this.collection = db.collection("users");
  }

  //creat new user
  async signup(userData) {
    const user = await this.collection.insertOne(userData);

    return user;
  }

  // to fetch all users
  async findAllUsers() {
    const users = await this.collection.find().toArray();
    return users;
  }

  // to find user with user id
  async findUserById(id) {
    return await this.collection.findOne({ _id: id });
  }

  // to find user with user email
  async findUserByEmail(email) {
    return await this.collection.findOne({ email: email });
  }

  // generale update to users collection
  async updateUser(userId, data) {
    return await this.collection.updateOne(
      { _id: userId },
      {
        $set: data,
      }
    );
  }

  // update a user with user email
  async updateUserByEmail(email, updateData) {
    await this.collection.updateOne({ email: email }, {
      $set: updateData
    })
  }
}

module.exports = User;
