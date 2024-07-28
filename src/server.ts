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
APP.use(express.urlencoded({ extended: false }));
APP.use(express.json());
APP.use(cookieParser());
APP.use((req, res, next) => {
  var allowedDomains = [
    `${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}`,
    `${process.env.REACT_APP_BASE_URL}:${process.env.PORT}`,
  ];
  var origin = req.headers.origin;
  if (origin && allowedDomains.indexOf(origin) > -1) {
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
            data: 'You can cross sub-tasks out',
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
        image: `${process.env.UPLOAD_WEBROOT}/demo-image.svg`,
      });
    }
  })
  .catch(console.error);

APP.listen(process.env.REACT_APP_SERVER_PORT, () => {
  console.log(
    `Server started on ${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}${APP.mountpath}`
  );
});
