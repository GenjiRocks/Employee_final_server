const Jimp = require("jimp");


//create thumbnail using jimp
exports.createThumbnail = async (imagePath, thumbnailPath) => {
  try {
    const image = await Jimp.read(imagePath);
    image.resize(150, 150);
    await image.writeAsync(thumbnailPath);
    console.log("Thumbnail created at:", thumbnailPath);
  } catch (err) {
    console.error("Error creating thumbnail:", err);
  }
};
