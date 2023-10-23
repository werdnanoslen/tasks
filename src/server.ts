import mysql2 from 'mysql2';
import cors from 'cors';
import express, { Application } from 'express';
import { Task } from './models/task';

const PORT: number = 8080;
const APP: Application = express();
APP.use(cors());
APP.use(express.json());

const pool = mysql2.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'Tasks',
});

function query(sql: string, values?): Promise<any> {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function getTasks(): Promise<Task[]> {
  const sql: string = 'SELECT * FROM tasks ORDER BY position';
  const tasks = await query(sql);
  tasks.map((task) => {
    try {
      task.data = JSON.parse(task.data);
      if (typeof(task.data) === 'number') task.data = ""+task.data
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
  const tasks = await getTasks();
  res.json(tasks);
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

APP.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}${APP.mountpath}`);
});
