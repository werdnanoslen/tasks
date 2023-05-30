import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import Form from './components/Form';
import FilterButton from './components/FilterButton';
import { Task, ListItem } from './models/task';
import * as API from './API';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const FILTER_MAP = {
  Doing: (task) => !task.done,
  Done: (task) => task.done,
};

const FILTER_TASKS = Object.keys(FILTER_MAP);

export default function App() {  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('Doing');
  const [narrator, setNarrator] = useState('');
  const [movement, setMovement] = useState(false);

  function refreshTasks() {
    API.getTasks().then(setTasks)
  }

  function toggleTaskDone(id) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, done: !task.done }).then(refreshTasks)
      }
    });
  }

  function toggleTaskPinned(id) {
    let updatedTasks: Task[] = [...tasks];
    let fromIndex = -1;
    let toIndex = -1;
    let updatedTask;
    tasks.forEach((task, i) => {
      if (id === task.id) {
        fromIndex = i;
        updatedTask = { ...task, pinned: !task.pinned };
      } else {
        if (task.pinned) toIndex = i + 1;
      }
    });
    updatedTasks.splice(fromIndex, 1)[0];
    updatedTasks.splice(toIndex, 0, updatedTask);
    API.replaceTasks(updatedTasks).then(refreshTasks);
  }

  function moveTask(id, indexes: number, moving?: Boolean) {
    let updatedTasks: Task[] = [...tasks];
    const fromIndex: number = tasks.findIndex((task) => id === task.id);
    if (moving !== undefined) {
      if (moving) {
        setNarrator(
          `Grabbed task at position ${
            fromIndex + 1
          }. Use arrows to change position, spacebar to drop.`
        );
        setMovement(true);
      } else {
        setNarrator(`Dropped task at position ${fromIndex + 1}.`);
        setMovement(false);
      }
      return;
    }
    const toIndex: number = fromIndex + indexes;
    if (toIndex < 0 || toIndex > updatedTasks.length) return;
    const task = tasks[fromIndex];
    updatedTasks.splice(fromIndex, 1)[0];
    updatedTasks.splice(toIndex, 0, task);
    API.replaceTasks(updatedTasks).then(refreshTasks);
    setNarrator(
      `Moved to position ${
        toIndex + 1
      }. Use arrows to change position, spacebar to drop.`
    );
  }

  function updateTask(id, newData) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, data: newData }).then(refreshTasks)
      }
    });
  }

  function addTask(data: string | ListItem[]) {
    const newTask: Task = { id: Date.now(), data: data, done: false, pinned: false };
    let updatedTasks: Task[] = [...tasks];
    for (var i = 0; i <= tasks.length; i++) {
      if (i === tasks.length || !tasks[i].pinned) {
        updatedTasks.splice(i, 0, newTask);
        break;
      }
    }
    API.replaceTasks(updatedTasks).then(refreshTasks);
  }

  const filterList = FILTER_TASKS.map((data) => (
    <FilterButton
      key={data}
      data={data}
      isPressed={data === filter}
      setFilter={setFilter}
    />
  ));

  const listHeadingRef = useRef<HTMLInputElement>(null);
  const prevTaskLength = usePrevious(tasks.length);
  
  useEffect(refreshTasks, []);
  useEffect(() => {
    console.table(tasks);
    if (prevTaskLength && tasks.length - prevTaskLength === -1) {
      listHeadingRef.current && listHeadingRef.current.focus();
    }
  }, [tasks, prevTaskLength]);

  return (
    <>
      <header>
        <h1>Tasks</h1>
        <div className="filters">{filterList}</div>
      </header>
      <main ref={listHeadingRef}>
        <div id="instructions" className="visually-hidden">
          Press spacebar to move task with arrow keys
        </div>
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          tabIndex={-1}
          className="visually-hidden"
        >
          {narrator}
        </div>
        <ReactSortable
          tag="ul"
          list={tasks}
          setList={(newItems, _, {dragging}) => {dragging && API.replaceTasks(newItems).then(refreshTasks);}}
          id="TaskList"
          filter="#new-task"
          preventOnFilter={false}
        >
          <Form addTask={addTask} id="new-task" hide={'Done' === filter} />
          {tasks.filter(FILTER_MAP[filter]).map((task) => (
            <Form
              id={task.id}
              data={task.data}
              done={task.done}
              toggleTaskDone={toggleTaskDone}
              pinned={task.pinned}
              toggleTaskPinned={toggleTaskPinned}
              moveTask={moveTask}
              movement={movement}
              key={task.id}
              deleteTask={() => API.deleteTask(task.id).then(refreshTasks)}
              updateTask={updateTask}
            />
          ))}
        </ReactSortable>
      </main>
    </>
  );
}