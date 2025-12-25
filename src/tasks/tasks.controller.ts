import express from 'express';
import Joi from 'joi';
import validateRequest from '../_middleware/validate-request.js';
import authorize from '../_middleware/authorize.js';
import * as taskService from './task.service.js';
import upload from '../_middleware/upload.js';

const taskRouter = express.Router();

taskRouter.get('/', authorize(), getTasks);
taskRouter.post('/', authorize(), addTaskSchema, addTask);
taskRouter.post('/image/', authorize(), upload.single('upload'), addImage);
taskRouter.post('/link-metadata', authorize(), getLinkMetadata);
taskRouter.delete('/:id', authorize(), deleteTask);
taskRouter.delete('/:taskId/:itemId', authorize(), deleteListItem);
taskRouter.put('/:id', authorize(), updateTaskSchema, updateTask);
taskRouter.put('/:id/move/:newPosition', authorize(), moveTask);

export default taskRouter;

function addTaskSchema(req, res, next) {
  const schema = Joi.object({
    data: Joi.alternatives().try(
      Joi.string().max(10000),
      Joi.array().items(Joi.object({
        id: Joi.string().required(),
        data: Joi.string().max(1000).allow(''),
        done: Joi.boolean()
      }))
    ).required(),
    position: Joi.number().integer(),
    done: Joi.boolean(),
    pinned: Joi.boolean(),
    image: Joi.string().allow('', null)
  });
  validateRequest(req, next, schema);
}

function updateTaskSchema(req, res, next) {
  const schema = Joi.object({
    data: Joi.alternatives().try(
      Joi.string().max(10000),
      Joi.array().items(Joi.object({
        id: Joi.string().required(),
        data: Joi.string().max(1000).allow(''),
        done: Joi.boolean()
      }))
    ),
    done: Joi.boolean(),
    pinned: Joi.boolean(),
    image: Joi.string().allow('', null)
  });
  validateRequest(req, next, schema);
}

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
  // Whitelist allowed fields to prevent mass assignment
  const allowedFields = ['data', 'done', 'pinned', 'image'];
  const updates = {};
  allowedFields.forEach(field => {
    if (field in req.body) {
      updates[field] = req.body[field];
    }
  });
  
  taskService
    .update(req.params.id, updates)
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
    const urlObj = new URL(url);
    
    // SSRF protection: block private/internal IP ranges and localhost
    const hostname = urlObj.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/,
      /^metadata\.google\.internal$/i,
      /169\.254\.169\.254/,
    ];
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return res.status(400).json({ error: 'Invalid URL: Cannot access private or internal resources' });
    }
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({ error: 'Invalid URL: Only http and https protocols are allowed' });
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    // Limit response size to prevent DoS
    const maxSize = 5 * 1024 * 1024; // 5MB
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(400).json({ error: 'Response too large' });
    }
    
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
