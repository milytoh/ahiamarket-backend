const validateImages = (req, res, next) => {
 const existingImages = JSON.parse(req.body.existingImages || "[]");
 const newImages = req.files?.map((file) => file.filename) || [];

 const totalImages = existingImages.length + newImages.length;

 if (totalImages === 0) {
   const err = new Error("At least 1 image is required");
   err.status = 400;
   throw err;
 }

  if (files.length > 3) {
    const err = new Error("Maximum of 3 images allowed.");
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  const invalidFiles = files.filter(
    (file) => !allowedTypes.includes(file.mimetype),
  );

  if (invalidFiles.length > 0) {
    const err = new Error("Only JPG, PNG, or WEBP images allowed.");
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }

  next();
};

module.exports = validateImages;
