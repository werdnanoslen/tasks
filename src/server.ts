import dotenv from 'dotenv';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import errorHandler from './_middleware/error-handler.js';
import { Task, Credentials } from './models/task.model.js';
import router from './users/users.controller.js';
import { query } from './_helpers/db.js';

dotenv.config();

const APP: Application = express();
APP.use(bodyParser.urlencoded({ extended: false }));
APP.use(bodyParser.json());
APP.use(cookieParser());
APP.use(function (req, res, next) {
  var allowedDomains = [
    `${process.env.REACT_APP_BASE_URL}:${process.env.REACT_APP_SERVER_PORT}`,
    `${process.env.REACT_APP_BASE_URL}:${process.env.PORT}`
  ];
  var origin = req.headers.origin;
  if(origin && allowedDomains.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
})
APP.use(express.json());

APP.use('/users', router);
APP.use(errorHandler);

async function getTasks(token): Promise<Task[]> {
  const sql: string = 'SELECT * FROM tasks ORDER BY position';
  const tasks = await query(sql);
  tasks.map((task) => {
    try {
      task.data = JSON.parse(task.data);
      if (typeof task.data === 'number') task.data = '' + task.data;
    } catch {}
  });
  return tasks;
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

APP.get('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[0];
  await getTasks(token)
    .then((tasks) => {
      res.json(tasks);
    })
    .catch((err) => {
      if (err.message.includes('invalid signature')) {
        res.status(500).json(err);
      } else if (
        err.name.includes('TokenExpiredError') ||
        err.message.includes('jwt must be provided')
      ) {
        res.status(401).json(err);
      } else {
        res.status(500).json(err);
      }
    });
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
