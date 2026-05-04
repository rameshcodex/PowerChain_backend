const passport = require('passport')
const User = require('../app/models/user')
const Admin = require('../app/models/admin')
const JwtStrategy = require('passport-jwt').Strategy

/** Matches tokens from login / refresh / admin (userId) and legacy shapes */
const subjectIdFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null
  const raw =
    payload.userId ??
    payload?.data?._id ??
    payload.id ??
    payload._id
  return raw != null ? String(raw) : null
}

/**
 * Extracts token from: header, body or query
 * @param {Object} req - request object
 * @returns {string} token - decrypted token
 */
const extractBearer = (authorizationHeader) => {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return null
  const parts = authorizationHeader.trim().split(/\s+/)
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1].trim()
  }
  return null
}

const jwtExtractor = (req) => {
  let token = extractBearer(req.headers.authorization)

  if (!token && req.body.token) {
    token = String(req.body.token).trim()
  } else if (!token && req.query.token) {
    token = String(req.query.token).trim()
  }

  return token
}

/**
 * Same secret as login (resolve at verify time so env is definitely loaded).
 */
const jwtOptions = {
  jwtFromRequest: jwtExtractor,
  secretOrKeyProvider: (_request, _rawJwtToken, done) => {
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    if (!secret) {
      return done(new Error('JWT_ACCESS_SECRET or JWT_SECRET must be set'))
    }
    done(null, secret)
  }
}

/**
 * Login with JWT middleware
 */
const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
  const subjectId = subjectIdFromPayload(payload)
  if (!subjectId) {
    return done(null, false)
  }
  ;(async () => {
    try {
      const user = await User.findById(subjectId).exec()
      if (user) {
        return done(null, user)
      }
      const adminUser = await Admin.findById(subjectId).exec()
      return done(null, adminUser || false)
    } catch (err) {
      return done(err, false)
    }
  })()
})

passport.use(jwtLogin)
