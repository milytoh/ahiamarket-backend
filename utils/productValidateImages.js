const validateImages = (req, res, next) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: "Please upload at least one image.",
    });
  }

  if (files.length > 3) {
    return res.status(400).json({
      message: "Maximum of 3 images allowed.",
    });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  const invalidFiles = files.filter(
    (file) => !allowedTypes.includes(file.mimetype),
  );

  if (invalidFiles.length > 0) {
    return res.status(400).json({
      message: "Only JPG, PNG, or WEBP images allowed.",
    });
  }

  next();
};

module.exports = validateImages;
