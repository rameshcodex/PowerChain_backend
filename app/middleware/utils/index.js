const { buildErrObject } = require('./buildErrObject')
const { buildSuccObject } = require('./buildSuccObject')
const { getBrowserInfo } = require('./getBrowserInfo')
const { getCountry } = require('./getCountry')
const { getIP } = require('./getIP')
const { checkApiCall } = require('./checkApiCall')
const { handleError } = require('./handleError')
const { isIDGood } = require('./isIDGood')
const { itemNotFound } = require('./itemNotFound')
const { removeExtensionFromFile } = require('./removeExtensionFromFile')
const { validateResult } = require('./validateResult')
const { validateLoginResult } = require('./validateLoginResult')
const { generateCaptcha } = require('./generateCaptcha')
const { handleValidation } = require('./handleValidation')

module.exports = {
  buildErrObject,
  buildSuccObject,
  getBrowserInfo,
  getCountry,
  getIP,
  checkApiCall,
  handleError,
  isIDGood,
  itemNotFound,
  removeExtensionFromFile,
  validateResult,
  validateLoginResult,
  generateCaptcha,
  handleValidation
}
