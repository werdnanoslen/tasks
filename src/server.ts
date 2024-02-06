import dotenv from 'dotenv';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import errorHandler from './_middleware/error-handler.js';
import { Task } from './models/task.model.js';
import router from './users/users.controller.js';
import authorize from './_middleware/authorize.js';
import db, { initialize, query } from './_helpers/db.js';
import { create } from './users/user.service.js';

dotenv.config();

const APP: Application = express();
APP.use(bodyParser.urlencoded({ extended: false }));
APP.use(bodyParser.json());
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
APP.use(express.json());

APP.use('/users', router);
APP.use(errorHandler);

initialize().then(() => {
  // Load demo data in dev environment
  if (process.env.NODE_ENV === 'dev') {
    create({ username: 'user', password: 'password' }).then(console.log).catch(console.error)
    // addTask({
    //   position: 1,
    //   id: 1,
    //   data: 'You can drag tasks around, mark them as done, delete, pin to the top of this list, and toggle between regular and checklist types',
    //   done: false,
    //   pinned: false,
    //   user_id: 1,
    // });
    // addTask({
    //   position: 2,
    //   id: 2,
    //   data: 'This is a regular task',
    //   done: false,
    //   pinned: false,
    //   user_id: 1,
    // });
    // addTask({
    //   position: 3,
    //   id: 3,
    //   data: [
    //     {
    //       id: 1699045008620,
    //       data: 'This is a checklist task',
    //       done: false,
    //     },
    //     {
    //       id: 1699045041759,
    //       data: 'You can cross sub-tasks out',
    //       done: true,
    //     },
    //   ],
    //   done: false,
    //   pinned: false,
    //   user_id: 1,
    // });
  }
}).catch(console.error)

async function getTasks(req, res, next) {
  db.Task.findAll({ where: { user_id: req.user.id } })
    .then((tasks) => {
      tasks.map((task) => {
        try {
          task.data = JSON.parse(task.data);
          if (typeof task.data === 'number') task.data = '' + task.data;
        } catch {}
      });
      res.json(tasks);
    })
    .catch(next);
}

async function addTask(task: Task): Promise<number> {
  const countResult = await query('SELECT COUNT(*) as count FROM tasks');
  task.position = countResult[0].count + 1;
  delete task.chosen;
  const sql: string = 'INSERT INTO tasks SET ?';
  if (typeof task.data !== 'string') {
    task.data = JSON.stringify(task.data);
  }
  const result = await query(sql, task);
  return result.affectedRows;
}

async function updateTask(id: string, task: Task): Promise<any> {
  delete task.chosen;
  const sql: string = 'UPDATE tasks SET ? WHERE id = ?';
  if (typeof task.data !== 'string') {
    task.data = JSON.stringify(task.data);
  }
  return await query(sql, [task, id])
    .then((result) => {
      return result.affectedRows;
    })
    .catch((e) => {
      return e;
    });
}

async function moveTask(id: string, newPos: number): Promise<number> {
  const posResult = await query('SELECT position FROM tasks WHERE id = ?', id);
  const oldPos: number = posResult[0].position;
  const [minPos, maxPos] =
    oldPos < newPos ? [oldPos, newPos] : [newPos, oldPos];
  const posOffset = newPos < oldPos ? 1 : -1;
  const prepSql: string =
    'UPDATE tasks SET position = position + ? WHERE position >= ? AND position <= ?;';
  const prepResult = await query(prepSql, [posOffset, minPos, maxPos]);
  const setSql: string = 'UPDATE tasks SET position = ? WHERE id = ?';
  const setResult = await query(setSql, [newPos, id]);
  return setResult.affectedRows;
}

async function deleteTask(id: string): Promise<number> {
  const sql: string = 'DELETE FROM tasks WHERE id = ?';
  const result = await query(sql, id);
  return result.affectedRows;
}

async function replaceTasks(tasks: Task[]): Promise<number> {
  const sql: string = 'TRUNCATE TABLE tasks';
  await query(sql);
  let affectedRows = 0;
  for (const task of tasks) {
    await addTask(task).then((ret) => (affectedRows += ret));
  }
  return affectedRows;
}

APP.get('/', authorize(), async (req, res, next) => {
  await getTasks(req, res, next).then(res.json).catch(next);
});

APP.post('/', async (req, res) => {
  const id = await addTask(req.body);
  res.json({ id });
});

APP.put('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await updateTask(id, req.body);
  res.json(result);
});

APP.put('/:id/move/:newPosition', async (req, res) => {
  const id = req.params.id;
  const newPosition = Number(req.params.newPosition);
  const result = await moveTask(id, newPosition);
  res.json({ result });
});

APP.put('/', async (req, res) => {
  const result = await replaceTasks(req.body);
  res.json({ result });
});

APP.delete('/:id', async (req, res) => {
  const id = req.params.id;
  const result = await deleteTask(id);
  res.json({ result });
});

APP.listen(process.env.REACT_APP_SERVER_PORT, () => {
  console.log(
    `Server started on ${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}${APP.mountpath}`
  );
});
