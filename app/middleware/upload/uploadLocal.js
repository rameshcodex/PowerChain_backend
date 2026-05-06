let multer = require('multer')
const { v4: uuidv4 } = require('uuid')

module.exports.files = {
  storage: function () {
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'public/images/')
      },
      filename: function (req, file, cb) {
        let myFile = file.originalname.split('.')
        const fileType = myFile[myFile.length - 1]
        cb(null, `${uuidv4()}.${fileType}`)
      }
    })

    return storage
  },

  allowedFile: function (req, file, cb) {

      !file.originalname.match(
        /\.(pdf|doc|txt|jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/
      )
    ) {
      req.fileValidationError = 'Only  files are allowed!'
      return cb(new Error('Only  files are allowed!'), false)
    }
    cb(null, true)
  }
}
