import React, { useState, useRef, useEffect } from 'react';
import Task from './components/Task';
import FilterButton from './components/FilterButton';
import { ReactSortable } from 'react-sortablejs';

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

function App(props) {
  const [tasks, setTasks] = useState<any>(props.tasks);
  const [filter, setFilter] = useState('Doing');
  const [narrator, setNarrator] = useState('');
  const [movement, setMovement] = useState(false);

  function toggleTaskDone(id) {
    const updatedTasks = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, done: !task.done };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function toggleTaskPinned(id) {
    let updatedTasks = [...tasks];
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
    setTasks(updatedTasks);
  }

  function moveTask(id, indexes: number, moving?: Boolean) {
    let updatedTasks = [...tasks];
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
    setTasks(updatedTasks);
    setNarrator(
      `Moved to position ${
        toIndex + 1
      }. Use arrows to change position, spacebar to drop.`
    );
  }

  function deleteTask(id) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
  }

  function editTask(id, newData) {
    const editedTaskList = tasks.map((task) => {
      if (id === task.id) {
        return { ...task, data: newData };
      }
      return task;
    });
    setTasks(editedTaskList);
  }

  const filterList = FILTER_TASKS.map((data) => (
    <FilterButton
      key={data}
      data={data}
      isPressed={data === filter}
      setFilter={setFilter}
    />
  ));

  function addTask(data) {
    const newTask = { id: Date.now(), data: data, done: false };
    let updatedTasks = [...tasks];
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].pinned) {
        updatedTasks.splice(i, 0, newTask);
        break;
      }
    }
    setTasks(updatedTasks);
  }

  const listHeadingRef = useRef<HTMLInputElement>(null);
  const prevTaskLength = usePrevious(tasks.length);

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
          setList={(newItems, _, {dragging}) => {dragging && setTasks(newItems)}}
          id="TaskList"
          filter="#new-task"
          preventOnFilter={false}
        >
          <Task addTask={addTask} id="new-task" hide={'Done' === filter} />
          {tasks.filter(FILTER_MAP[filter]).map((task) => (
            <Task
              id={task.id}
              data={task.data}
              done={task.done}
              toggleTaskDone={toggleTaskDone}
              pinned={task.pinned}
              toggleTaskPinned={toggleTaskPinned}
              moveTask={moveTask}
              movement={movement}
              key={task.id}
              deleteTask={deleteTask}
              editTask={editTask}
            />
          ))}
        </ReactSortable>
      </main>
    </>
  );
}

export default App;
