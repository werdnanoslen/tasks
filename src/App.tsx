import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import Form from './components/Form';
import FilterButton from './components/FilterButton';
import { Task, ListItem } from './models/task';
import * as API from './api';

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
    API.getTasks().then(setTasks);
  }

  function toggleTaskDone(id) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, done: !task.done }).then(refreshTasks);
      }
    });
  }

  function toggleTaskPinned(id) {
    let updatedTasks = [...tasks];
    let fromPosition = 0;
    let toPosition = 0;
    updatedTasks.forEach((task, i) => {
      delete updatedTasks[i].chosen;
      if (id === task.id) {
        fromPosition = i;
        updatedTasks[i].pinned = !task.pinned;
      } else if (task.pinned) {
        ++toPosition;
      }
    });
    const movedTask = updatedTasks.splice(fromPosition, 1)[0];
    updatedTasks.splice(toPosition, 0, movedTask);
    API.replaceTasks(updatedTasks).then(refreshTasks);
  }

  function moveTask(id, indexes: number, moving?: Boolean) {
    let updatedTasks: Task[] = [...tasks];
    const fromPosition: number = tasks.findIndex((task) => id === task.id);
    if (moving !== undefined) {
      if (moving) {
        setNarrator(
          `Grabbed task at position ${
            fromPosition + 1
          }. Use arrows to change position, spacebar to drop.`
        );
        setMovement(true);
      } else {
        setNarrator(`Dropped task at position ${fromPosition + 1}.`);
        setMovement(false);
      }
      return;
    }
    const toPosition: number = fromPosition + indexes;
    if (toPosition < 0 || toPosition > updatedTasks.length) return;
    const task = tasks[fromPosition];
    updatedTasks.splice(fromPosition, 1)[0];
    updatedTasks.splice(toPosition, 0, task);
    API.replaceTasks(updatedTasks).then(refreshTasks);
    setNarrator(
      `Moved to position ${
        toPosition + 1
      }. Use arrows to change position, spacebar to drop.`
    );
  }

  function dragTask(event) {
    const { item, newIndex } = event;
    API.moveTask(item.id, newIndex).then(refreshTasks);
  }

  function updateData(id, newData) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, data: newData }).then(refreshTasks);
      }
    });
  }

  function addTask(data: string | ListItem[]) {
    const newTask: Task = {
      position: tasks.length + 1,
      id: Date.now(),
      data: data,
      done: false,
      pinned: false,
    };
    let updatedTasks: Task[] = [...tasks];
    for (var i = 0; i <= tasks.length; i++) {
      if (i === tasks.length || !tasks[i].pinned) {
        updatedTasks.splice(i, 0, newTask);
        break;
      }
    }
    // API.replaceTasks(updatedTasks).then(refreshTasks);
    API.addTask(newTask).then(refreshTasks);
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
    console.table(
      tasks.sort(function (a, b) {
        return a.position - b.position;
      })
    );
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
          setList={setTasks}
          id="TaskList"
          filter=".filtered"
          preventOnFilter={false}
          onChange={dragTask}
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
              updateData={updateData}
            />
          ))}
        </ReactSortable>
      </main>
    </>
  );
}
