/**
 * Handles error by printing to console in development env and builds and sends an error response
 * @param {Object} res - response object
 * @param {Object} err - error object
 */
const httpStatusFromErr = (err = {}) => {
    const candidates = [err.code, err.statusCode, err.status]
    for (const c of candidates) {
        const n = Number(c)
        if (Number.isInteger(n) && n >= 400 && n <= 599) return n
    }
    return 500
}

const handleError = (res = {}, err = {}) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(err)
    }
    const statusCode = httpStatusFromErr(err)
    const msg = Array.isArray(err.message) ? err.message[0]?.msg : err.message
    res.status(statusCode).json({
        success: false,
        result: null,
        message: msg || 'Something went wrong'
    })
}

module.exports = { handleError }
