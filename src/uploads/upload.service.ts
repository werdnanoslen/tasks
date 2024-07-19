import db from '../_helpers/db.js';
import { Upload } from './upload.model.js';

export async function create(file, username: string): Promise<string> {
  const upload: Upload = {
    id: file.filename.split('_')[0], //splits out UUID given by middleware
    filename: file.filename,
    path: file.path,
    user: username,
  };
  const uploadId = await db.Upload.create(upload);
  return `${process.env.UPLOAD_WEBROOT}/${uploadId.dataValues.filename}`;
}

async function _delete(id) {
  const upload = await getUpload(id);
  await upload.destroy();
}
export { _delete as delete };

async function _deleteAll() {
  await db.Upload.destroy({ truncate: true });
}
export { _deleteAll as deleteAll };

// helper functions

async function getUpload(id) {
  const upload = await db.Upload.findByPk(id);
  if (!upload) throw 'Upload not found';
  return upload;
}
