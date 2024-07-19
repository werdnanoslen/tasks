import multer from 'multer';
import fs from 'fs-extra';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = process.env.UPLOAD_PATH;
    fs.mkdirsSync(path);
    cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, `${crypto.randomUUID()}_${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

export default upload;
