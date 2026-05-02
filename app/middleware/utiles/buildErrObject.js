const buildErrObject = (code = '', message = '') => {
  return {
    code,
    message
  }
}

module.exports = { buildErrObject }
