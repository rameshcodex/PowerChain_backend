const { sendEmailadmin } = require('./sendEmailadmin')

/**
 * Prepares to send email
 * @param {string} user - user object
 * @param {string} subject - subject
 * @param {string} htmlMessage - html message
 */
const prepareToSendEmailAdmin = (user = {}, subject = '', htmlMessage = '') => {
  user = {
    // name: user.name,
    email: user.email,
    verification: user.verification
  }
  const data = {
    user,
    subject,
    htmlMessage
  }
  console.log(data, user.email, 'data')
  if (process.env.NODE_ENV === 'production') {
    sendEmailadmin(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log(data)
    sendEmailadmin(data, (messageSent) =>
      messageSent
        ? console.log(`Email SENT to: ${user.email}`)
        : console.log(`Email FAILED to: ${user.email}`)
    )
  }
}

module.exports = { prepareToSendEmailAdmin }
