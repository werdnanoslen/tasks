import express from 'express';
import authorize from '../_middleware/authorize.js';
import upload from '../_middleware/upload.js';
import * as uploadService from './upload.service.js';

const uploadRouter = express.Router();

uploadRouter.post('/', authorize(), upload.single('upload'), storeUpload);
uploadRouter.delete('/:id', authorize(), deleteUpload);

export default uploadRouter;

async function storeUpload(req, res, next) {
  // req.user for anything?
  uploadService
    .create(req.file, req.user.username)
    .then((ret) => res.json(ret))
    .catch(next);
}
async function deleteUpload(req, res, next) {
  // req.user for anything?
  uploadService.delete(req.params.id).then(res.json).catch(next);
}
