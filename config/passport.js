const passport = require('passport')
const User = require('../app/models/user')
const Admin = require('../app/models/admin')
const auth = require('../app/middleware/auth')
const JwtStrategy = require('passport-jwt').Strategy

/**
 * Extracts token from: header, body or query
 * @param {Object} req - request object
 * @returns {string} token - decrypted token
 */
const jwtExtractor = (req) => {
  let token = null

  if (req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '').trim()
  } else if (req.body.token) {
    token = req.body.token.trim()
  } else if (req.query.token) {
    token = req.query.token.trim()
  }

  return token
}

console.log('JWT Extractor initializedssssssssssss') // Debug log

/**
 * Options object for jwt middlware
 */
const jwtOptions = {
  jwtFromRequest: jwtExtractor,
  secretOrKey: process.env.JWT_SECRET
}

console.log('JWT Options:', jwtOptions, process.env.JWT_SECRET, "process.env.JWT_SECRET") // Debug log

/**
 * Login with JWT middleware
 */
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  User.findById(payload.data._id, (err, user) => {
    console.log('JWT Payload:', payload.data._id) // Debug log
    if (err) {
      return done(err, false)
    }
    console.log('JWT Payload:', payload.data._id) // Debug log
    if (user) {
      return done(null, user)
    } else {
      Admin.findById(payload.data._id, (err, user1) => {
        if (err) {
          return done(err, false)
        }
        return !user1 ? done(null, false) : done(null, user1)
      })
    }
    // return !user ? done(null, false) :
  })
})

passport.use(jwtLogin)
