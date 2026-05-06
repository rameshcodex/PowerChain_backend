/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
const handleError = (res = {}, err = {}) => {
  // Prints error in console
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }
  // Sends error to user
  const statusCode =
    typeof err.code === 'number' && err.code >= 100 && err.code <= 599
      ? err.code
      : 500
  res.status(statusCode).json({
    success: false,
    result: null,
    message: Array.isArray(err.message) ? err.message[0].msg : err.message
  })
}

module.exports = { handleError }
