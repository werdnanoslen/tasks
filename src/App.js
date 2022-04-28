import React, { useState, useRef, useEffect } from "react";
import Form from "./components/Form";
import FilterButton from "./components/FilterButton";
import Task from "./components/Task";
import { nanoid } from "nanoid";


function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const FILTER_MAP = {
  Doing: task => !task.done,
  Done: task => task.done
};

const FILTER_TASKS = Object.keys(FILTER_MAP);

function App(props) {
  const [tasks, setTasks] = useState(props.tasks);
  const [filter, setFilter] = useState('Doing');

  function toggleTaskDone(id) {
    const updatedTasks = tasks.map(task => {
      // if this task has the same ID as the edited task
      if (id === task.id) {
        // use object spread to make a new obkect
        // whose `done` prop has been inverted
        return {...task, done: !task.done}
      }
      return task;
    });
    setTasks(updatedTasks);
  }


  function deleteTask(id) {
    const remainingTasks = tasks.filter(task => id !== task.id);
    setTasks(remainingTasks);
  }


  function editTask(id, newText) {
    const editedTaskList = tasks.map(task => {
    // if this task has the same ID as the edited task
      if (id === task.id) {
        //
        return {...task, text: newText}
      }
      return task;
    });
    setTasks(editedTaskList);
  }

  const taskList = tasks
  .filter(FILTER_MAP[filter])
  .map(task => (
    <Task
      id={task.id}
      text={task.text}
      done={task.done}
      key={task.id}
      toggleTaskDone={toggleTaskDone}
      deleteTask={deleteTask}
      editTask={editTask}
    />
  ));

  const filterList = FILTER_TASKS.map(text => (
    <FilterButton
      key={text}
      text={text}
      isPressed={text === filter}
      setFilter={setFilter}
    />
  ));

  function addTask(text) {
    const newTask = { id: "task-" + nanoid(), text: text, done: false };
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
          <div className="filters">
            {filterList}
          </div>
        </div>
        {(filter === 'Doing') && <Form addTask={addTask} />}
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
