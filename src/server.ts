import mysql2 from 'mysql2';
import cors from 'cors';
import express, { Application } from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { Task, Credentials } from './models/task';

const APP: Application = express();
APP.use(cors());
APP.use(express.json());

const pool = mysql2.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
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

async function verify(token): Promise<string> {
  return jsonwebtoken.verify(
    token,
    process.env.TOKEN_SECRET,
    async (err, decoded) => {
      if (err) throw err;
      return decoded.username;
    }
  );
}

async function getTasks(token): Promise<Task[]> {
  return verify(token).then(async (user) => {
    const sql: string = 'SELECT * FROM tasks WHERE username = ? ORDER BY position';
    const tasks = await query(sql, user);
    tasks.map((task) => {
      try {
        task.data = JSON.parse(task.data);
        if (typeof task.data === 'number') task.data = '' + task.data;
      } catch {}
    });
    return tasks;
  });
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
  try {
    const tasks = await getTasks(token);
    res.json(tasks);
  } catch (err) {
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
  }
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

APP.post('/login', async (req, res) => {
  const { username, password }: Credentials = req.body;
  var token = jsonwebtoken.sign(
    { username: username },
    process.env.TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token: token });
});

APP.listen(process.env.SERVER_PORT, () => {
  console.log(
    `Server started on http://localhost:${process.env.SERVER_PORT}${APP.mountpath}`
  );
});
