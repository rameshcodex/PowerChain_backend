const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../app/models/user")

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value

        let user = await User.findOne({ email })

        // 🔹 SIGNUP (if new user)
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            provider: "google",
            isVerified: true,
          })
        }

        // 🔹 SIGNIN (if user exists)
        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)
