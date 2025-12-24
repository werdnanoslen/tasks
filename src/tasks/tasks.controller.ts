import express from 'express';
import authorize from '../_middleware/authorize.js';
import * as taskService from './task.service.js';
import upload from '../_middleware/upload.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTask);
taskRouter.post('/image/', authorize(), upload.single('upload'), addImage);
taskRouter.post('/link-metadata', authorize(), getLinkMetadata);
taskRouter.delete('/:id', authorize(), deleteTask);
taskRouter.delete('/:taskId/:itemId', authorize(), deleteListItem);
taskRouter.put('/:id', authorize(), updateTask);
taskRouter.put('/:id/move/:newPosition', authorize(), moveTask);

export default taskRouter;

async function getTasks(req, res, next) {
  taskService
    .getAll(req.user.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

export async function addTask(req, res, next) {
  let task = Object.assign(req.body, { user_id: req.user.id });
  taskService
    .create(task)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function addImage(req, res, next) {
  res.json(`${process.env.UPLOAD_WEBROOT}/${req.file.filename}`);
}

async function deleteTask(req, res, next) {
  taskService
    .delete(req.params.id)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function deleteListItem(req, res, next) {
  taskService
    .delete(req.params.taskId, req.params.itemId)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function updateTask(req, res, next) {
  taskService
    .update(req.params.id, req.body)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function moveTask(req, res, next) {
  const id = req.params.id;
  const newPos = Number(req.params.newPosition);
  taskService
    .move(id, newPos)
    .then((ret) => res.json(ret))
    .catch(next);
}

async function getLinkMetadata(req, res, next) {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    const html = await response.text();
    
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1];
    let title = ogTitle || html.match(/<title>([^<]+)<\/title>/i)?.[1] || url;
    
    // Decode HTML entities
    title = title
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    // Try to find favicon - prefer dark mode version
    const urlObj = new URL(url);
    const origin = urlObj.origin;
    
    // First check for dark mode favicon
    let favicon = html.match(/<link[^>]*rel="icon"[^>]*media="[^"]*dark[^"]*"[^>]*href="([^"]+)"/i)?.[1];
    
    // Fallback to standard favicon
    if (!favicon) {
      favicon = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/i)?.[1] || 
                html.match(/<link[^>]*rel="shortcut icon"[^>]*href="([^"]+)"/i)?.[1];
    }
    
    if (favicon && !favicon.startsWith('http')) {
      favicon = favicon.startsWith('/') ? `${origin}${favicon}` : `${origin}/${favicon}`;
    }
    if (!favicon) {
      favicon = `${origin}/favicon.ico`;
    }

    res.json({ title, favicon, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
}
