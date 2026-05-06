const jwt = require('jsonwebtoken')
const fs = require('fs')

const ETHPrivate = fs.readFileSync(`${__dirname}/eth_private_key.pem`)
const generateToken = async (type) => {
  try {
    const token = jwt.sign(
      { id: 'f7b3a9e8-4c12-3d56-9a2f-1e0b87c654d9' },
      ETHPrivate,
      {
        algorithm: 'RS256',
        noTimestamp: true,
        expiresIn: '1m'
      }
    )
    return {
      status: true,
      token: `Bearer ${token}`
    }
  } catch (error) {
    console.log(error, 'errror')
    return false
  }
}

module.exports = { generateToken }
