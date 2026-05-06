const { verifyToken } = require('./verifyToken')
const User = require('../../models/user')

module.exports = async function socketAuth(socket, next) {
  try {
    let token = null
    // Try to get token from handshake query or headers
    if (socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token
    } else if (
      socket.handshake.headers &&
      (socket.handshake.headers['authorization'] ||
        socket.handshake.headers['Authorization'])
    ) {
      const authHeader =
        socket.handshake.headers['authorization'] ||
        socket.handshake.headers['Authorization']
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      } else {
        token = authHeader
      }
    }
    if (!token) {
      return next(new Error('No token provided'))
    }
    const userId = verifyToken(token)
    if (!userId) {
      return next(new Error('Invalid token'))
    }
    const user = await User.findById(userId)
    if (!user) {
      return next(new Error('User not found'))
    }
    socket.user = user
    next()
  } catch (err) {
    next(new Error('Socket authentication failed'))
  }
}
