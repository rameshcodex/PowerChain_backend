const removeExtensionFromFile = (file) => {
    return file.split('.').slice(0, -1).join('.').toString();
}


module.exports = {removeExtensionFromFile};