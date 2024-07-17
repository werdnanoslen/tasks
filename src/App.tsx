import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
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
  Doing: (task: Task) => !task.done,
  Done: (task: Task) => task.done,
};

const FILTER_TASKS = Object.keys(FILTER_MAP);

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('Doing');
  const [narrator, setNarrator] = useState('');
  const [movement, setMovement] = useState(false);
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 100,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
        } else {
          console.error(err.response || err);
        }
      });
  }

  function toggleTaskDone(id, done) {
    API.updateTask(id, { done: !done }).then(refreshTasks);
    setNarrator('Task marked done. Next task now focused.');
  }

  function toggleTaskPinned(id, pinned) {
    API.updateTask(id, { pinned: !pinned }).then(refreshTasks);
    setNarrator(`Task pinned. Next task now focused.`);
  }

  function dragTask(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(({ id }) => id === active.id);
        const newIndex = items.findIndex(({ id }) => id === over.id);
        API.moveTask(active.id, newIndex + 1).then(refreshTasks);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function updateData(id, newData) {
    API.updateTask(id, { data: newData }).then((ret) => {
      if (ret.code && ret.code === 'ER_DATA_TOO_LONG') {
        setError('Task content is too long. No changes have been saved.');
      } else {
        setError('');
        refreshTasks();
      }
    });
  }

  function addTask(data: string | ListItem[]) {
    const newTask: Task = {
      position: tasks.length + 1,
      id: self.crypto.randomUUID(),
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

  function deleteTask(id: string) {
    API.deleteTask(id)
      .then(refreshTasks)
      .catch((e) => console.error(e.response.data.message));
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
    authed && console.table(tasks);
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

  const formSection = (task: Task) => (
    <Form
      id={task.id}
      data={task.data}
      done={task.done}
      toggleTaskDone={() => toggleTaskDone(task.id, task.done)}
      pinned={task.pinned}
      toggleTaskPinned={() => toggleTaskPinned(task.id, task.pinned)}
      movement={movement}
      key={task.id}
      deleteTask={() => deleteTask(task.id)}
      updateData={() => updateData(task.id, task.data)}
      error={error}
      setNarrator={setNarrator}
    />
  );
  const allForms = (
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragTask}
      >
        <SortableContext items={tasks.map((t) => t.id)}>
          <ul>
            {tasks
              .filter(FILTER_MAP[filter])
              .filter((t) => t.pinned)
              .map(formSection)}
          </ul>
        </SortableContext>
      </DndContext>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragTask}
      >
        <SortableContext items={tasks.map((t) => t.id)}>
          <ul>
            {tasks
              .filter(FILTER_MAP[filter])
              .filter((t) => !t.pinned)
              .map(formSection)}
          </ul>
        </SortableContext>
      </DndContext>
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
        {authed ? allForms : <Login isAuthed={isAuthed} />}
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
