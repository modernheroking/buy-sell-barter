const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('./cloudinary');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = { upload, uploadToCloudinary };