const User = require("../models/user");

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

exports.getUserProfile = async (req, res, next) => {
    
  const userId = new ObjectId(req.user.userId);
 
   const userModel = await userfn();

}