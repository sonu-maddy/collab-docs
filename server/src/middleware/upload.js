const multer = require('multer');
const env = require('../config/env');

// Memory storage: files are parsed to HTML and discarded; nothing touches the disk.
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
});
