import multer from "multer";
import path from "path";
import fs from "fs";

const audioDirectory = "uploads/audio";
const resumeDirectory = "uploads/resumes";

if (!fs.existsSync(audioDirectory)) {
  fs.mkdirSync(audioDirectory, {
    recursive: true
  });
}

if (!fs.existsSync(resumeDirectory)) {
  fs.mkdirSync(resumeDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "resume") {
      cb(null, resumeDirectory);
    } else {
      cb(null, audioDirectory);
    }
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const audioTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp4"
  ];

  if (file.fieldname === "resume") {
    const extension = path.extname(file.originalname).toLowerCase();

    const allowedResumeExtensions = [
      ".pdf",
      ".docx"
    ];

    if (allowedResumeExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF and DOCX files are allowed for resumes"),
        false
      );
    }

    return;
  }

  if (audioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export default upload;