const i18n = require('i18n')
const { prepareToSendEmailAdmin } = require('./prepareToSendEmailAdmin')
const { prepareToSendEmail } = require('./prepareToSendEmail')

/**
 * Sends registration email
 * @param {string} locale - locale
 * @param {Object} user - user object
 */
const sendRegistrationEmailMessage = (locale = '', user = {}, str) => {
  i18n.setLocale(locale)
  // const subject = i18n.__('registration.SUBJECT')
  const subject = 'General Enquiry '
  const htmlMessage = str
  prepareToSendEmailAdmin(user, subject, htmlMessage)
}

const sendRegistrationMessage = (locale = '', user = {}, str) => {
  i18n.setLocale(locale)
  console.log('user')

  // const subject = 'Verify Email'
  const subject = 'Registration email'
  const htmlMessage = str
  prepareToSendEmail(user, subject, htmlMessage)
}

module.exports = { sendRegistrationEmailMessage, sendRegistrationMessage }
