import mysql2 from 'mysql2';
import cors from 'cors';
import express from 'express';
import { Request, Response, Application } from 'express';
import { Task } from './models/task';

const app: Application = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const db = mysql2.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'Tasks',
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Connected to database');
  }
});

app.get('/tasks', (req: Request, res: Response) => {
  db.query('SELECT * FROM tasks', (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error retrieving tasks from database');
    } else {
      res.status(200).json(result);
    }
  });
});

app.post('/tasks', (req: Request, res: Response) => {
  const { data, done, pinned } = req.body;
  const newTask: Task = { id: Date.now(), data, done, pinned };
  db.query('INSERT INTO tasks SET ?', newTask, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error saving task to database');
    } else {
      res.status(201).send(`Task ${result} saved to database`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
