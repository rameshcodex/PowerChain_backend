const passport = require('passport')
const { Strategy: JwtStrategy } = require('passport-jwt')
const User = require('../app/models/user')
const Admin = require('../app/models/admin')


const jwtExtractor = (req) => {
  console.log('--- JWT EXTRACTOR CALLED ---')

  if (req.headers.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.replace('Bearer ', '').trim()
    return token
  }

  if (req.body?.token) {
    return req.body.token.trim()
  }
  if (req.query?.token) {
    return req.query.token.trim()
  }

  console.log('No token found')
  return null
}

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: jwtExtractor,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    },
    async (payload, done) => {
      try {
        console.log('--- JWT VERIFIED ---')
        console.log('JWT payload:', payload)

        // Check search in both User and Admin collections
        let user = await User.findById(payload.userId)

        if (!user) {
          user = await Admin.findById(payload.userId)
        }

        console.log('User found:', !!user)

        if (!user) {
          console.log('User not found in DB')
          return done(null, false)
        }

        console.log('Authentication successful')
        return done(null, user)
      } catch (err) {
        console.error('Passport error:', err)
        return done(err, false)
      }
    }
  )
)

module.exports = passport
