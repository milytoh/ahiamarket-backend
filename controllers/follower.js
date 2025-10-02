const { ObjectId } = require("mongodb");

const mongodbConnect = require("../models/db");
const Follower = require("../models/follower");
const { Vendor } = require("../models/vendor");
const User = require("../models/user");

async function followerfn() {
  const { db } = await mongodbConnect();
  return new Follower(db);
}

async function vendorfn() {
  const { db } = await mongodbConnect();
  return new Vendor(db);
}

async function userfn() {
  const { db } = await mongodbConnect();
  return new User(db);
}

exports.follow = async (req, res, next) => {
  const userId = new ObjectId(req.user.userId);
  const vendorId = new ObjectId(req.body.vendorId) ;

  try {
    const followerModel = await followerfn();
    const vendorModel = await vendorfn();
    const userModel = await userfn();

    //find a user with user id
    const user = await userModel.findUserById(userId);
    if (!user) {
      const error = new Error("user not found");
      error.status = 404;

      throw error;
    }

    //find a vendor
    const vendor = await vendorModel.findByVendorId(vendorId);
    if (!vendor) {
      const error = new Error("no vendor found");
      error.status = 404;
      throw error;
    }

    //find if a user is already folowing a vendor
    const follower = await followerModel.findFollower(userId, vendorId);
    if (follower) {
      await followerModel.unfollowVendor(userId, vendorId);
     return  res.status(200).json({
         success: true,
         message: " unfollow vendor successfully",
       });
    }

      const followData = {
      vendor: vendor._id,
      user: user._id,
      followed_at: new Date(),
      updated_at: Date.now(),
      };
      
      await followerModel.followVendor(followData);
      res.status(200).json({
        success: true, 
        message: " following vendor successfully"
      })
  } catch (error) {
    next(error);
  }
};
