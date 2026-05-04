const passport = require('passport')

const requireAuth = (req, res, next) => {
  console.log("CAlling auth")
  passport.authenticate('jwt', { session: false }, (err, user) => {
    console.log("Inside auth callback", err, user)
    if (err) {
      console.error('Auth error:', err)
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Authentication error',
      })
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Unauthorizedddddddddddddddddd',
      })
    }

    req.user = user
    next()
  })(req, res, next)
}

module.exports = { requireAuth }
