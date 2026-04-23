const validateImages = (req, res, next) => {
  const files = req.files;

  if (!files || files.length === 0) {
    const err = new Error("Please upload at least one image.");
    err.statusCode = 400;
    err.isOperational = true;

    return next(err);
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
