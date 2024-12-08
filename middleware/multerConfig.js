import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "member_photo");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Format Image tidak sesuai"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});


const uploadFilePhoto = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error instanceof multer.MulterError) {

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          status: 102,
          message: "File Melebihi Limit 5Mb",
          data: null,
        });
      }
    } else if (error) {

      return res.status(400).json({
        status: 102,
        message: error.message,
        data: null,
      });
    }
    next();
  });
};

export default uploadFilePhoto;
