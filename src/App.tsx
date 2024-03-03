import React, { useState, useRef, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import Login from './components/Login';
import Account from './components/Account';
import Form from './components/Form';
import FilterButton from './components/FilterButton';
import { Task, ListItem } from './tasks/task.model';
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
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  async function isAuthed() {
    const status = await API.getLoginStatus();
    setAuthed(status.isLoggedIn);
  }

  function refreshTasks() {
    API.getTasks()
      .then(setTasks)
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthed(false);
          // TODO add polling to avoid wasted user effort
        } else {
          console.error(err.response || err);
        }
      });
  }

  function toggleTaskDone(id) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, done: !task.done }).then(refreshTasks);
        setNarrator('Task marked done. Next task now focused.');
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
    setNarrator(
      `Task pinned in position ${toPosition}. Next task now focused.`
    );
  }

  function moveTask(id, indexes: number, moving?: Boolean) {
    let updatedTasks: Task[] = [...tasks];
    const fromPosition: number = tasks.findIndex((task) => id === task.id);
    if (moving !== undefined) {
      if (moving) {
        setNarrator(
          `Grabbed task at position ${
            fromPosition + 1
          }. Use arrows to change position, space to drop.`
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
      }. Use arrows to change position, space to drop.`
    );
  }

  function dragTask(event) {
    const { item, newIndex } = event;
    item.position = Math.max(newIndex, 1);
    API.moveTask(item.id, item.position).then(refreshTasks);
  }

  function updateData(id, newData) {
    tasks.map((task) => {
      if (id === task.id) {
        API.updateTask({ ...task, data: newData }).then((ret) => {
          if (ret.code && ret.code === 'ER_DATA_TOO_LONG') {
            setError('Task content is too long. No changes have been saved.');
          } else {
            setError('');
            refreshTasks();
          }
        });
      }
    });
  }

  function addTask(data: string | ListItem[]) {
    const newTask: Task = {
      position: tasks.length + 1,
      id: Date.now(),
      data: data ?? '',
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
    API.addTask(newTask).then(refreshTasks);
  }

  function deleteTask(id: number) {
    API.deleteTask(id).then(refreshTasks).catch((e) => console.error(e.response.data.message));
    setNarrator('Deleted task');
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

  useEffect(() => {
    isAuthed();
    authed && refreshTasks();
  }, [authed]);
  useEffect(() => {
    authed &&
      console.table(
        tasks.sort(function (a, b) {
          a.position ??= 0;
          b.position ??= 0;
          return a.position - b.position;
        })
      );
    if (prevTaskLength && tasks.length - prevTaskLength === -1) {
      listHeadingRef.current && listHeadingRef.current.focus();
    }
  }, [tasks, prevTaskLength, narrator]);

  const emptyAll = tasks.length === 0;
  const emptyDone =
    'Done' === filter && tasks.filter(FILTER_MAP['Done']).length === 0;
  const emptyDoing =
    'Doing' === filter && tasks.filter(FILTER_MAP['Doing']).length === 0;
  const emptyMsg =
    (emptyAll && 'No tasks added yet') ||
    (emptyDone && 'Nothing is marked done yet') ||
    (emptyDoing && 'All done! 🎉') ||
    undefined;

  const formSection = (
    <>
      <Form
        addTask={addTask}
        id="new-task"
        hide={'Done' === filter}
        setNarrator={setNarrator}
      />
      <p id="emptyMsg" hidden={!emptyMsg}>
        {emptyMsg}
      </p>
      <ReactSortable
        tag="ul"
        list={tasks}
        setList={setTasks}
        id="TaskList"
        filter=".filtered, .input"
        preventOnFilter={false}
        onChange={dragTask}
      >
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
            deleteTask={() => deleteTask(task.id)}
            updateData={updateData}
            error={error}
            setNarrator={setNarrator}
          />
        ))}
      </ReactSortable>
    </>
  );

  return (
    <>
      <header>
        <a href="#main" id="skip-main">
          Skip to main content
        </a>
        <h1>Tasks</h1>
        <div className="filters" hidden={!authed}>
          {filterList}
        </div>
      </header>
      <div role="alert" hidden={!error}>
        {error}
      </div>
      <main id="main" ref={listHeadingRef} data-authed={authed}>
        {authed ? formSection : <Login isAuthed={isAuthed} />}
      </main>
      <div
        role="alert"
        title="Last screen reader alert"
        className="visually-hidden"
      >
        {narrator}
      </div>
      <Account isAuthed={isAuthed} hidden={!authed} />
    </>
  );
}
