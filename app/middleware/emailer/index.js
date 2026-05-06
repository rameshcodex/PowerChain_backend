const { emailExists } = require('./emailExists')
const { emailExistsExcludingMyself } = require('./emailExistsExcludingMyself')
const { prepareToSendEmail } = require('./prepareToSendEmail')
const { sendEmail } = require('./sendEmail')
const { sendEmailadmin } = require('./sendEmailadmin')
const { prepareToSendEmailAdmin } = require('./prepareToSendEmailAdmin')
const {
  sendRegistrationEmailMessage,
  sendRegistrationMessage
} = require('./sendRegistrationEmailMessage')
const {
  sendResetPasswordEmailMessage
} = require('./sendResetPasswordEmailMessage')

module.exports = {
  emailExists,
  emailExistsExcludingMyself,
  prepareToSendEmail,
  prepareToSendEmailAdmin,
  sendEmail,
  sendEmailadmin,
  sendRegistrationEmailMessage,
  sendRegistrationMessage,
  sendResetPasswordEmailMessage
}
