const express = require("express");
const axios = require("axios");
// const sharp = require("sharp");
const app = express();
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
// import { exec } from "child_process";
// import { promisify } from "util";
// const imageCompression = require('browser-image-compression')
const port = 3000;

app.use(express.json());
// const execPromise = promisify(exec);

// Endpoint to compress an image
app.post("/compress", async (req: any, res: any) => {
  // const { imageUrl } = req.body;

  // if (!imageUrl) {
  //   return res.status(400).json({ error: "imageUrl is required" });
  // }

  // try {
  //   const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

  // // Get the size of the original image
  // const originalImageSize = Buffer.byteLength(response.data);
  // console.log(`Original image size: ${originalImageSize} bytes`);

  // // Optimize the image using sharp with advanced settings
  // const compressedImage = await sharp(response.data)
  // .resize({ width: 500 }) // Resize the image if necessary
  // .webp({
  //   quality: 1, // Set a high quality to maintain visual fidelity
  //   lossless: true, // Use lossless compression
  //   // effort: 6, // Compression effort (0-6), higher is slower but better compression
  // })
  // .toBuffer();
  //   // Get the size of the compressed image
  //   const compressedImageSize = Buffer.byteLength(compressedImage);
  //   console.log(
  //     `Compressed image size: ${compressedImageSize} bytes`);
  //   // Set headers and return the compressed image
  //   res.set("Content-Type", "image/webp");
  //   res.send(compressedImage);
  const { videoUrl } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl is required" });
  }

  try {
    const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

    // Get the size of the original video
    const originalVideoSize = Buffer.byteLength(response.data);
    console.log(`Original video size: ${originalVideoSize} bytes`);

    // Save the original video to a temporary file
    const inputPath = path.join(__dirname, `${uuidv4()}.mp4`);
    fs.writeFileSync(inputPath, response.data);

    const outputPath = path.join(__dirname, `${uuidv4()}_compressed.mp4`);

    // Compress the video using ffmpeg with more aggressive settings
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("360x?") // Lower resolution even more
      .videoBitrate("500k") // Lower video bitrate further
      .audioBitrate("16k") // Lower audio bitrate further
      .fps(10) // Further reduce frame rate
      .outputOptions("-preset", "veryslow") // Use veryslow preset for better compression
      .outputOptions("-crf", "50") // Increase CRF for more compression
      .outputOptions("-movflags", "faststart") // Enable progressive streaming
      .outputOptions("-pix_fmt", "yuv420p") // Set pixel format to ensure compatibility
      .outputOptions("-f", "mp4") // Ensure output format is MP4
      .outputOptions("-qscale", "0") // Use -qscale for quality scaling
      .on("end", () => {
        // Read the compressed video
        const compressedVideo = fs.readFileSync(outputPath);

        // Get the size of the compressed video
        const compressedVideoSize = Buffer.byteLength(compressedVideo);
        console.log(`Compressed video size: ${compressedVideoSize} bytes`);

        // Set headers and return the compressed video
        res.set("Content-Type", "video/mp4");
        res.send(compressedVideo);

        // Clean up temporary files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      })
      .on("error", (err: any) => {
        console.error("Error compressing video:", err);
        res.status(500).json({ error: "Failed to compress video" });

        // Clean up temporary files in case of error
        fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      })
      .save(outputPath);
    // const { videoUrl } = req.body;

    // if (!videoUrl) {
    //   return res.status(400).json({ error: "videoUrl is required" });
    // }

    // try {
    //   const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

    //   // Get the size of the original video
    //   const originalVideoSize = Buffer.byteLength(response.data);
    //   console.log(`Original video size: ${originalVideoSize} bytes`);

    //   // Save the original video to a temporary file
    //   const inputPath = path.join(__dirname, `${uuidv4()}.mp4`);
    //   fs.writeFileSync(inputPath, response.data);

    //   const outputPath = path.join(__dirname, `${uuidv4()}_compressed.mp4`);

    //   // Compress the video using HandBrakeCLI with aggressive settings
    //  const handbrakeCommand = `HandBrakeCLI -i "${inputPath}" -o "${outputPath}" --preset=" Fast 720p30" --quality 40 --aencoder "aac" --audio "1" --mixdown "stereo" --vb 500 --width 120 --height 150`;

    //   const { stdout, stderr } = await execPromise(handbrakeCommand);
    //   // console.log("HandBrakeCLI stdout:", stdout);
    //   // console.log("HandBrakeCLI stderr:", stderr);

    //   // Check if the compressed video file exists
    //   if (!fs.existsSync(outputPath)) {
    //     throw new Error(`Compressed video file not found: ${outputPath}`);
    //   }

    //   // Read the compressed video
    //   const compressedVideo = fs.readFileSync(outputPath);

    //   // Get the size of the compressed video
    //   const compressedVideoSize = Buffer.byteLength(compressedVideo);
    //   console.log(`Compressed video size: ${compressedVideoSize} bytes`);

    //   // Set headers and return the compressed video
    //   res.set("Content-Type", "video/mp4");
    //   res.send(compressedVideo);

    //   // Clean up temporary files
    //   fs.unlinkSync(inputPath);
    //   fs.unlinkSync(outputPath);
  } catch (error) {
    console.error("Error compressing video:", error);
    res.status(500).json({ error: "Failed to compress video" });
  }
});

app.listen(port, () => {
  console.log(`Image compression API listening at http://localhost:${port}`);
});
