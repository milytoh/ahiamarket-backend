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
      },
    );
  }

  // update a user with user email
  async updateUserByEmail(email, updateData) {
    await this.collection.updateOne(
      { email: email },
      {
        $set: updateData,
      },
    );
  }

  // update users status
  async updateStatus(id, data) {
    await this.collection.updateOne(
      { _id: id },
      {
        $set: data,
      },
    );
  }

  //users profile
  async profile(userId) {
    const pipeline = [
      { $match: { _id: userId } },

      /* Orders */
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },

      /* Wallet */
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "userId",
          as: "wallet",
        },
      },

      { $unwind: { path: "$wallet", preserveNullAndEmptyArrays: true } },

      /* Stats */
      {
        $addFields: {
          completedOrders: {
            $size: {
              $filter: {
                input: "$orders",
                as: "o",
                cond: { $eq: ["$$o.status", "completed"] },
              },
            },
          },
          disputes: {
            $size: {
              $filter: {
                input: "$orders",
                as: "o",
                cond: { $eq: ["$$o.status", "disputed"] },
              },
            },
          },
        },
      },

      /* Trust Score */
      {
        $addFields: {
          trustScoreValue: {
            $min: [
              100,
              {
                $add: [
                  80,
                  { $multiply: ["$completedOrders", 2] },
                  { $multiply: ["$disputes", -15] },
                ],
              },
            ],
          },
        },
      },

      {
        $addFields: {
          trustLabel: {
            $cond: [{ $gte: ["$trustScoreValue", 85] }, "Excellent", "Good"],
          },
        },
      },

      /* Final Projection (THIS IS THE KEY PART) */
      {
        $project: {
          user: {
            id: "$_id",
            fullName: "$fullName",
            email: "$email",
            avatar: "$avatar",
            memberSince: "$createdAt",
          },

          stats: {
            totalOrders: { $size: "$orders" },
            completedOrders: "$completedOrders",
            disputes: "$disputes",
          },

          wallet: {
            balance: { $ifNull: ["$wallet.balance", 0] },
            currency: "USD",
          },

          trustScore: {
            value: "$trustScoreValue",
            label: "$trustLabel",
            breakdown: [
              {
                icon: "payments",
                label: "Payment History",
                value: "Excellent",
                isPrimary: true,
              },
              {
                icon: "stars",
                label: "Order Reliability",
                value: {
                  $concat: [{ $toString: "$completedOrders" }, " completed"],
                },
                isPrimary: true,
              },
            ],
          },

          recentOrders: {
            $slice: [
              {
                $map: {
                  input: "$orders",
                  as: "o",
                  in: {
                    id: "$$o._id",
                    amount: "$$o.amount",
                    status: "$$o.status",
                    createdAt: "$$o.createdAt",
                  },
                },
              },
              5,
            ],
          },
        },
      },
    ];
    const result = await this.collection.aggregate(pipeline).toArray();

    return result[0] || null;
  }
}

module.exports = User;
