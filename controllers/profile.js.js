
const { ObjectId } = require("mongodb");
const mongodbConnect = require("../models/db");

const User = require("../models/user");

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

exports.getUserProfile = async (req, res, next) => {
     
  try {
    const userId = new ObjectId(req.user.userId);
 
    const userModel = await userfn();
    
    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("user not found");
      error.status = 404;
      error.isOperational = true;
      throw error;
    }

    

    let profile = await userModel.profile(userId);

    console.log(profile, "prooooo")

    res.status(200).json(
      {
        success: true,
        message: "user profile",
        profile
      }
    )

  } catch (error) {
    next(error)
  }


}