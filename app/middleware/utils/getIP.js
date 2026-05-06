const requestIp = require('request-ip')

/**
 * Gets IP from user
 * @param {*} req - request object
 */
const getIP = (req) => {
  let ip = requestIp.getClientIp(req)
  
  // Clean IPv6 localhost or mapped IPv4
  if (ip === '::1') {
    ip = '127.0.0.1'
  } else if (ip && ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '')
  }
  
  return ip
}

module.exports = { getIP }
