import React, { useState, useRef, useEffect } from 'react';
import Task from './components/Task';
import FilterButton from './components/FilterButton';
import { nanoid } from 'nanoid';

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
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new obkect
        // whose `done` prop has been inverted
        return { ...task, done: !task.done };
      }
      return task;
    });
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

  const taskList = tasks
    .filter(FILTER_MAP[filter])
    .map((task) => (
      <Task
        id={task.id}
        data={task.data}
        done={task.done}
        key={task.id}
        toggleTaskDone={toggleTaskDone}
        deleteTask={deleteTask}
        editTask={editTask}
      />
    ));

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
    setTasks([...tasks, newTask]);
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
      <div id="controls">
        <div id="header">
          <h1>Tasks</h1>
          <button onClick={() => console.log(tasks)}>test</button>
          <div className="filters">{filterList}</div>
        </div>
        {filter === 'Doing' && <Task addTask={addTask} id="new-task" />}
      </div>
      <ul
        role="list"
        className="task-list stack-exception"
        aria-labelledby="list-heading"
        ref={listHeadingRef}
      >
        {taskList}
      </ul>
    </>
  );
}

export default App;
