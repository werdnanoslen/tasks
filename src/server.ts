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
  const sql: string = 'SELECT * FROM tasks';
  const tasks = await query(sql);
  tasks.map((task) => {
    console.log('task', task.data);
    try {
      task.data = JSON.parse(task.data);
    } catch { }
  })
  return tasks;
}

async function addTask(task: Task): Promise<number> {
  const sql: string = 'INSERT INTO tasks SET ?';
  if (typeof(task.data) !== 'string') {
    task.data = JSON.stringify(task.data);
  }
  const result = await query(sql, task);
  return result.affectedRows;
}

async function updateTask(id: string, task: Task): Promise<number> {
  const sql: string = 'UPDATE tasks SET ? WHERE id = ?';
  const result = await query(sql, [task, id]);
  return result.affectedRows;
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
    await addTask(task).then((ret) => affectedRows += ret);
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
  console.log(`Server started on port ${PORT}`);
});
