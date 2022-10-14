import React, { useState, useRef, useEffect } from 'react';
import Task from './components/Task';
import FilterButton from './components/FilterButton';
import { nanoid } from 'nanoid';
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
  const [tasks, setTasks] = useState(props.tasks);
  const [filter, setFilter] = useState('Doing');

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
    let updatedTask: Task;
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

  function deleteTask(id) {
    const remainingTasks = tasks.filter((task) => id !== task.id);
    setTasks(remainingTasks);
  }

  function editTask(id, newData) {
    const editedTaskList = tasks.map((task) => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        //
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
    const newTask = { id: 'task-' + nanoid(), data: data, done: false };
    let updatedTasks = [...tasks];
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].pinned) {
        updatedTasks.splice(i, 0, newTask);
        break;
      }
    }
    setTasks(updatedTasks);
  }

  const listHeadingRef = useRef(null);
  const prevTaskLength = usePrevious(tasks.length);

  useEffect(() => {
    if (tasks.length - prevTaskLength === -1) {
      listHeadingRef.current.focus();
    }
  }, [tasks.length, prevTaskLength]);

  return (
    <>
      <header>
        <h1>Tasks</h1>
        <div className="filters">{filterList}</div>
      </header>
      <main ref={listHeadingRef}>
        <ReactSortable
          tag="ul"
          list={tasks}
          setList={setTasks}
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
