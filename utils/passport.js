const passport = require("passport");
const GoogleStratagy = require("passport-google-oauth20").Strategy;
require("dotenv").config();
const jwt = require("jsonwebtoken");

passport.use(
  new GoogleStratagy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/account/auth/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      // console.log("Google profile:", profile);

      console.log(profile)

      const user = {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0].value,
        picture: profile.photos?.[0].value,
      };

      const token = jwt.sign(
        {
          userId: user.googleId,
          email: user.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "6h",
        }
      );

      // Add token to user so you can access it later
      user.token = token;

      // Optional: save to DB
      done(null, user);
    }
  )
);

// Serialize/deserialize if using session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
