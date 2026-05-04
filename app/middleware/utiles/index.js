const { removeExtensionFromFile } = require('./removeExtensionFromFile')
const { buildErrObject } = require('./buildErrObject')
const { handleValidation } = require('./handleValidation')
const { itemNotFound } = require('./itemNotFound')
const { handleError } = require('./handleError')


module.exports = {
    removeExtensionFromFile,
    buildErrObject,
    handleValidation, itemNotFound, handleError
}