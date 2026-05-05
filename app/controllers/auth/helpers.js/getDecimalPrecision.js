function getDecimalPrecision(value) {
  const str = value.toString()
  if (!str.includes('.')) return 0
  const decimalPart = str.split('.')[1]
  return decimalPart.search(/[^0]/) + 1
}

module.exports = {getDecimalPrecision};