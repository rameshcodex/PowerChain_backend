const JWT = require('jsonwebtoken')
const { decrypt } = require('./decrypt')

function verifyToken(token) {
  const newToken = decrypt(token)
  const response = JWT.verify(newToken, process.env.JWT_SECRET)
  if (!response) {
    return false
  }

  return response?.data?._id
}

module.exports = { verifyToken }
