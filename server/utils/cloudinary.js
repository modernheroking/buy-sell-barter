const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');


console.log('Cloudinary URL loaded?', !!process.env.CLOUDINARY_URL);

function uploadToCloudinary(buffer, folder = 'buy-sell-barter') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { uploadToCloudinary, cloudinary };