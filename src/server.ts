import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import errorHandler from './_middleware/error-handler.js';
import { initialize } from './_helpers/db.js';
import userRouter from './users/users.controller.js';
import taskRouter from './tasks/tasks.controller.js';
import { create as createUser, getAll } from './users/user.service.js';
import { create as createTask } from './tasks/task.service.js';

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

APP.use('/users', userRouter);
APP.use('/tasks', taskRouter);
APP.use(errorHandler);

initialize()
  .then(async () => {
    // Load demo data in dev environment
    if (process.env.NODE_ENV === 'dev') {
      await createUser({ username: 'user', password: 'password' }).catch(
        console.error
      )
      const newUserId = (await getAll())[0].id
      
      await createTask({
        id: 1,
        data: 'You can drag tasks around, mark them as done, delete, pin to the top of this list, and toggle between regular and checklist types',
        done: false,
        pinned: false,
        user_id: newUserId,
      });
      await createTask({
        id: 2,
        data: 'This is a regular task',
        done: false,
        pinned: false,
        user_id: newUserId,
      });
      await createTask({
        id: 3,
        data: [
          {
            id: 1699045008620,
            data: 'This is a checklist task',
            done: false,
          },
          {
            id: 1699045041759,
            data: 'You can cross sub-tasks out',
            done: true,
          },
        ],
        done: false,
        pinned: false,
        user_id: newUserId,
      });
    }
  })
  .catch(console.error);

APP.listen(process.env.REACT_APP_SERVER_PORT, () => {
  console.log(
    `Server started on ${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}${APP.mountpath}`
  );
});
