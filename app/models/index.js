const fs = require('fs')
const path = require('path')
const { removeExtensionFromFile } = require('../middleware/utiles')

const modelsPath = __dirname

module.exports = () => {
    fs.readdirSync(modelsPath).forEach((file) => {
        const modelFile = removeExtensionFromFile(file)

        if (modelFile !== 'index') {
            require(path.join(modelsPath, modelFile))
        }
    })
}
