import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { ScrollableSortable } from './components/ScrollableSortable';
import Login from './components/Login';
import Account from './components/Account';
import Form from './components/Form';
import FilterButton from './components/FilterButton';
import { Task, ListItem } from './tasks/task.model';
import * as API from './api';
import usePrevious from './hooks';
import { errorToast } from './errorToast';

const FILTER_MAP = {
  Doing: (task: Task) => !task.done,
  Done: (task: Task) => task.done,
};

const FILTER_TASKS = Object.keys(FILTER_MAP);

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('Doing');
  const [narrator, setNarrator] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);
  const [newItemId, setNewItemId] = useState('');

  async function isAuthed() {
    const status = await API.getLoginStatus();
    setAuthed(status.isLoggedIn);
  }

  const refreshTasks = useCallback(() => {
    API.getTasks()
      .then(setTasks)
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthed(false);
        } else {
          errorToast(err.response || err);
        }
      });
  }, []);

  const toggleTaskDone = useCallback(
    (id, done) => {
      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, done: !done } : task
        )
      );
      API.updateTask(id, { done: !done }).catch((err) => {
        errorToast(err);
        refreshTasks(); // Revert on error
      });
      setNarrator(
        `Task marked ${done ? 'un' : ''}done. Next task now focused.`
      );
    },
    [refreshTasks]
  );

  const toggleTaskPinned = useCallback(
    (id, pinned) => {
      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, pinned: !pinned } : task
        )
      );
      API.updateTask(id, { pinned: !pinned }).catch((err) => {
        errorToast(err);
        refreshTasks(); // Revert on error
      });
      setNarrator(`Task ${pinned ? 'un' : ''}pinned. Next task now focused.`);
    },
    [refreshTasks]
  );

  const dragTask = useCallback(
    (newOrder: Task[]) => {
      // newOrder is the reordered array after drag ends
      // Find which task moved by comparing with current tasks
      const movedTask = newOrder.find(
        (t, i) => tasks.findIndex((o) => o.id === t.id) !== i
      );
      if (movedTask) {
        const newIndex = newOrder.findIndex((t) => t.id === movedTask.id);
        API.moveTask(movedTask.id, newIndex + 1).then(refreshTasks);
      }
    },
    [tasks, refreshTasks]
  );

  const updateData = useCallback(
    (id: string, newData?: string | ListItem[], image?: File) => {
      let updates: Partial<Task> = { ...(newData && { data: newData }) };
      if (image) {
        const imageForm = new FormData();
        imageForm.append('upload', image);
        API.addImage(imageForm)
          .then((imagePath) => {
            updates.image = imagePath;
            API.updateTask(id, updates).then((ret) => {
              if (ret.code && ret.code === 'ER_DATA_TOO_LONG') {
                setError(
                  'Task content is too long. No changes have been saved.'
                );
              } else {
                setError('');
                refreshTasks();
              }
            });
          })
          .catch(errorToast);
      } else if (image === undefined && newData === undefined) {
        // Explicitly delete the image when both are undefined
        updates.image = '';
        API.updateTask(id, updates).then((ret) => {
          setError('');
          refreshTasks();
        });
      } else {
        API.updateTask(id, updates).then((ret) => {
          if (ret.code && ret.code === 'ER_DATA_TOO_LONG') {
            setError('Task content is too long. No changes have been saved.');
          } else {
            setError('');
            refreshTasks();
          }
        });
      }
    },
    [refreshTasks]
  );

  const addTask = useCallback(
    (data: string | ListItem[], image?: File) => {
      let newTask: Task = {
        position: tasks.length + 1,
        id: crypto.randomUUID(),
        data: data ?? '',
        done: false,
        pinned: false,
      };
      if (image) {
        const imageForm = new FormData();
        imageForm.append('upload', image);
        API.addImage(imageForm)
          .then((imagePath) => {
            newTask.image = imagePath;
            API.addTask(newTask).then(refreshTasks).catch(errorToast);
          })
          .catch(errorToast);
      } else {
        API.addTask(newTask).then(refreshTasks);
      }
    },
    [tasks.length, refreshTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      API.deleteTask(id)
        .then(refreshTasks)
        .catch((e) => errorToast(e.response?.data?.message || e));
      setNarrator('Deleted task');
    },
    [refreshTasks]
  );

  const deleteListItem = useCallback(
    async (taskId: string, itemId: string): Promise<void> => {
      try {
        await API.deleteListItem(taskId, itemId);
        refreshTasks();
        setNarrator('Deleted list item');
      } catch (e: any) {
        errorToast(e.response?.data?.message || e);
      }
    },
    [refreshTasks]
  );

  const filterList = FILTER_TASKS.map((data) => (
    <FilterButton
      key={data}
      data={data}
      isPressed={data === filter}
      setFilter={setFilter}
    />
  ));

  const listHeadingRef = useRef<HTMLInputElement>(null);
  const prevTaskLength = usePrevious<number>(tasks.length);

  useEffect(() => {
    isAuthed();
    authed && refreshTasks();
  }, [authed, refreshTasks]);
  useEffect(() => {
    if (prevTaskLength && tasks.length - prevTaskLength === -1) {
      listHeadingRef.current && listHeadingRef.current.focus();
    }
  }, [tasks, prevTaskLength, narrator, authed]);

  // Memoize filtered task lists
  const { pinnedTasks, unpinnedTasks } = useMemo(() => {
    const filtered = tasks.filter(FILTER_MAP[filter]);
    return {
      pinnedTasks: filtered.filter((t) => t.pinned),
      unpinnedTasks: filtered.filter((t) => !t.pinned),
    };
  }, [tasks, filter]);

  const emptyAll = tasks.length === 0;
  const emptyDone =
    'Done' === filter && pinnedTasks.length === 0 && unpinnedTasks.length === 0;
  const emptyDoing =
    'Doing' === filter &&
    pinnedTasks.length === 0 &&
    unpinnedTasks.length === 0;
  const emptyMsg =
    (emptyAll && 'No tasks added yet') ||
    (emptyDone && 'Nothing is marked done yet') ||
    (emptyDoing && 'All done! 🎉') ||
    undefined;

  const formSection = (task: Task) => (
    <Form
      key={task.id}
      id={task.id}
      image={task.image}
      data={task.data}
      updateData={updateData}
      done={task.done}
      toggleTaskDone={toggleTaskDone}
      pinned={task.pinned}
      toggleTaskPinned={toggleTaskPinned}
      deleteListItem={deleteListItem}
      deleteTask={deleteTask}
      error={error}
      setNarrator={setNarrator}
      newItemId={newItemId}
      setNewItemId={setNewItemId}
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
      <ScrollableSortable
        tag="ul"
        className="sortable-list"
        list={pinnedTasks.map((t) => ({
          ...t,
          chosen: false,
          selected: false,
        }))}
        setList={(newOrder) => {
          dragTask(newOrder);
          setTasks((prev) => {
            const pinnedIds = new Set(pinnedTasks.map((t) => t.id));
            const unpinned = prev.filter((t) => !pinnedIds.has(t.id));
            return [...newOrder, ...unpinned];
          });
        }}
        delay={500}
        delayOnTouchOnly={true}
        touchStartThreshold={5}
        animation={150}
      >
        {pinnedTasks.map(formSection)}
      </ScrollableSortable>
      <ScrollableSortable
        tag="ul"
        className="sortable-list"
        list={unpinnedTasks.map((t) => ({
          ...t,
          chosen: false,
          selected: false,
        }))}
        setList={(newOrder) => {
          dragTask(newOrder);
          setTasks((prev) => {
            const unpinnedIds = new Set(unpinnedTasks.map((t) => t.id));
            const pinned = prev.filter((t) => !unpinnedIds.has(t.id));
            return [...pinned, ...newOrder];
          });
        }}
        delay={500}
        delayOnTouchOnly={true}
        touchStartThreshold={5}
        animation={150}
      >
        {unpinnedTasks.map(formSection)}
      </ScrollableSortable>
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
