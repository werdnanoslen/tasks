import express, { Application } from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import errorHandler from './_middleware/error-handler.js';
import { initialize } from './_helpers/db.js';
import userRouter from './users/users.controller.js';
import taskRouter from './tasks/tasks.controller.js';
import {
  create as createUser,
  deleteAll as deleteAllUsers,
} from './users/user.service.js';
import {
  create as createTask,
  deleteAll as deleteAllTasks,
} from './tasks/task.service.js';

const APP: Application = express();
APP.use(express.urlencoded({ extended: false, limit: '1mb' }));
APP.use(express.json({ limit: '1mb' }));
APP.use(cookieParser());

// Security headers
APP.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

APP.use((req, res, next) => {
  const allowedDomains = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .filter(Boolean);
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, PATCH, DELETE'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-Requested-With,content-type, Accept'
    );
    return res.sendStatus(200);
  }
  if (origin && allowedDomains.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type, Accept'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

APP.use(express.static(process.env.UPLOAD_PATH));

APP.use('/users', userRouter);
APP.use('/tasks', taskRouter);
APP.use(errorHandler);

initialize()
  .then(async () => {
    // Load demo data in dev environment
    if (process.env.NODE_ENV === 'dev' && process.argv.includes('demo')) {
      await deleteAllUsers();
      await deleteAllTasks();

      const user = await createUser({
        username: 'user',
        password: 'password',
      }).catch(console.error);

      await createTask({
        id: crypto.randomUUID(),
        data: 'You can drag tasks around, mark them as done, delete, pin to the top of this list, and toggle between regular and checklist types',
        done: false,
        pinned: false,
        user_id: user.id,
      });

      await createTask({
        id: crypto.randomUUID(),
        data: [
          {
            id: crypto.randomUUID(),
            data: 'This is a checklist task',
            done: false,
          },
          {
            id: crypto.randomUUID(),
            data: '1',
            done: true,
          },
          {
            id: crypto.randomUUID(),
            data: '2',
            done: true,
          },
          {
            id: crypto.randomUUID(),
            data: '3',
            done: true,
          },
          {
            id: crypto.randomUUID(),
            data: '4',
            done: true,
          },
          {
            id: crypto.randomUUID(),
            data: '5',
            done: true,
          },
          {
            id: crypto.randomUUID(),
            data: '6',
            done: true,
          },
        ],
        done: false,
        pinned: false,
        user_id: user.id,
      });

      await createTask({
        id: crypto.randomUUID(),
        data: 'You can upload images too',
        done: false,
        pinned: false,
        user_id: user.id,
        image: `/public/demo-screenshot.png`,
      });
    }
  })
  .catch(console.error);

APP.listen(process.env.SERVER_PORT, () => {
  console.log(
    `Server started on ${process.env.BASE_URL}:${process.env.SERVER_PORT}${APP.mountpath ?? ''}`
  );
});
