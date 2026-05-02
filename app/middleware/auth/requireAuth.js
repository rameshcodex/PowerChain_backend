const passport = require('passport')

const requireAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
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
        message: 'Unauthorized',
      })
    }

    req.user = user
    next()
  })(req, res, next)
}

module.exports = {requireAuth}
