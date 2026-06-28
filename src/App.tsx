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

type PendingOp =
  | { type: 'addTask'; task: Task }
  | { type: 'updateTask'; id: string; updates: Partial<Task> }
  | { type: 'deleteTask'; id: string }
  | { type: 'moveTask'; orderedIds: string[] }
  | { type: 'deleteListItem'; taskId: string; itemId: string };

function applyOpsToTasks(tasks: Task[], ops: PendingOp[]): Task[] {
  return ops.reduce((acc, op) => {
    switch (op.type) {
      case 'addTask':
        return acc.find((t) => t.id === op.task.id) ? acc : [op.task, ...acc];
      case 'updateTask':
        return acc.map((t) => (t.id === op.id ? { ...t, ...op.updates } : t));
      case 'deleteTask':
        return acc.filter((t) => t.id !== op.id);
      case 'deleteListItem':
        return acc.map((t) =>
          t.id === op.taskId && Array.isArray(t.data)
            ? {
                ...t,
                data: (t.data as ListItem[]).filter((i) => i.id !== op.itemId),
              }
            : t
        );
      case 'moveTask': {
        const ordered = op.orderedIds
          .map((id) => acc.find((t) => t.id === id))
          .filter((t): t is Task => t !== undefined);
        const orderedSet = new Set(op.orderedIds);
        const rest = acc.filter((t) => !orderedSet.has(t.id));
        return [...ordered, ...rest];
      }
      default:
        return acc;
    }
  }, tasks);
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached: Task[] = JSON.parse(
        localStorage.getItem('cachedTasks') || '[]'
      );
      const pending: PendingOp[] = JSON.parse(
        localStorage.getItem('pendingOps') || '[]'
      );
      return applyOpsToTasks(cached, pending);
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState('Doing');
  const [narrator, setNarrator] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(
    () => localStorage.getItem('authed') === 'true'
  );
  const [newItemId, setNewItemId] = useState('');
  const [, setLastSynced] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineSince, setOfflineSince] = useState<Date | null>(() => {
    if (navigator.onLine) return null;
    const stored = localStorage.getItem('offlineSince');
    return stored ? new Date(stored) : new Date();
  });
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'synced-flash'
  >('idle');
  const pendingOpsRef = useRef<PendingOp[]>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem('pendingOps') || '[]');
      } catch {
        return [];
      }
    })()
  );
  const [pendingCount, setPendingCount] = useState(
    () => pendingOpsRef.current.length
  );

  const enqueueOp = useCallback((op: PendingOp) => {
    const next = [...pendingOpsRef.current, op];
    pendingOpsRef.current = next;
    localStorage.setItem('pendingOps', JSON.stringify(next));
    setPendingCount(next.length);
  }, []);

  async function replayOp(op: PendingOp): Promise<void> {
    switch (op.type) {
      case 'addTask':
        await API.addTask(op.task);
        break;
      case 'updateTask':
        await API.updateTask(op.id, op.updates);
        break;
      case 'deleteTask':
        await API.deleteTask(op.id);
        break;
      case 'moveTask':
        for (let i = 0; i < op.orderedIds.length; i++)
          await API.moveTask(op.orderedIds[i], i + 1);
        break;
      case 'deleteListItem':
        await API.deleteListItem(op.taskId, op.itemId);
        break;
    }
  }

  function getOfflineLabel(since: Date | null): string {
    if (!since) return 'Offline';
    const minutes = Math.floor((Date.now() - since.getTime()) / 60_000);
    if (minutes < 2) return 'Offline';
    if (minutes < 60)
      return `Offline for ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    return `Offline for ${hours} hour${hours !== 1 ? 's' : ''}`;
  }

  async function isAuthed() {
    try {
      const status = await API.getLoginStatus();
      setAuthed(status.isLoggedIn);
      if (status.isLoggedIn) localStorage.setItem('authed', 'true');
      else localStorage.removeItem('authed');
    } catch (e: any) {
      if (e.response) {
        setAuthed(false);
        localStorage.removeItem('authed');
      }
      // Network error — keep cached auth state
    }
  }

  const refreshTasks = useCallback(() => {
    API.getTasks()
      .then((data) => {
        setTasks(applyOpsToTasks(data, pendingOpsRef.current));
        setLastSynced(new Date());
        localStorage.setItem('cachedTasks', JSON.stringify(data));
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setAuthed(false);
          localStorage.removeItem('authed');
        } else if (navigator.onLine) {
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
      if (!navigator.onLine) {
        enqueueOp({ type: 'updateTask', id, updates: { done: !done } });
      } else {
        API.updateTask(id, { done: !done }).catch((err) => {
          errorToast(err);
          refreshTasks(); // Revert on error
        });
      }
      setNarrator(
        `Task marked ${done ? 'un' : ''}done. Next task now focused.`
      );
    },
    [refreshTasks, enqueueOp]
  );

  const toggleTaskPinned = useCallback(
    (id, pinned) => {
      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, pinned: !pinned } : task
        )
      );
      if (!navigator.onLine) {
        enqueueOp({ type: 'updateTask', id, updates: { pinned: !pinned } });
      } else {
        API.updateTask(id, { pinned: !pinned }).catch((err) => {
          errorToast(err);
          refreshTasks(); // Revert on error
        });
      }
      setNarrator(`Task ${pinned ? 'un' : ''}pinned. Next task now focused.`);
    },
    [refreshTasks, enqueueOp]
  );

  const dragTask = useCallback(
    (movedId: string, serverPosition: number, orderedIds: string[]) => {
      if (!navigator.onLine) {
        enqueueOp({ type: 'moveTask', orderedIds });
      } else {
        API.moveTask(movedId, serverPosition)
          .then(refreshTasks)
          .catch(console.error);
      }
    },
    [refreshTasks, enqueueOp]
  );

  const updateData = useCallback(
    (id: string, newData?: string | ListItem[], image?: File) => {
      let updates: Partial<Task> = { ...(newData && { data: newData }) };
      if (image) {
        // Image uploads require network — skip queueing
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
        if (!navigator.onLine) {
          enqueueOp({ type: 'updateTask', id, updates });
        } else {
          API.updateTask(id, updates).then(() => {
            setError('');
            refreshTasks();
          });
        }
      } else {
        if (!navigator.onLine) {
          enqueueOp({ type: 'updateTask', id, updates });
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
      }
    },
    [refreshTasks, enqueueOp]
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
        // Image uploads require network — skip queueing
        const imageForm = new FormData();
        imageForm.append('upload', image);
        API.addImage(imageForm)
          .then((imagePath) => {
            newTask.image = imagePath;
            API.addTask(newTask)
              .then(() => API.moveTask(newTask.id, 1))
              .then(refreshTasks)
              .catch(errorToast);
          })
          .catch(errorToast);
      } else if (!navigator.onLine) {
        enqueueOp({ type: 'addTask', task: newTask });
        enqueueOp({
          type: 'moveTask',
          orderedIds: [newTask.id, ...tasks.map((t) => t.id)],
        });
        setTasks((prev) => [newTask, ...prev]);
      } else {
        API.addTask(newTask)
          .then(() => API.moveTask(newTask.id, 1))
          .then(refreshTasks);
      }
    },
    [tasks, refreshTasks, enqueueOp]
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (!navigator.onLine) {
        enqueueOp({ type: 'deleteTask', id });
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        API.deleteTask(id)
          .then(refreshTasks)
          .catch((e) => errorToast(e.response?.data?.message || e));
      }
      setNarrator('Deleted task');
    },
    [refreshTasks, enqueueOp]
  );

  const deleteListItem = useCallback(
    async (taskId: string, itemId: string): Promise<void> => {
      if (!navigator.onLine) {
        enqueueOp({ type: 'deleteListItem', taskId, itemId });
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId && Array.isArray(t.data)
              ? {
                  ...t,
                  data: (t.data as ListItem[]).filter((i) => i.id !== itemId),
                }
              : t
          )
        );
        setNarrator('Deleted list item');
        return;
      }
      try {
        await API.deleteListItem(taskId, itemId);
        refreshTasks();
        setNarrator('Deleted list item');
      } catch (e: any) {
        errorToast(e.response?.data?.message || e);
      }
    },
    [refreshTasks, enqueueOp]
  );

  const filterList = FILTER_TASKS.map((data) => (
    <FilterButton
      key={data}
      data={data}
      isPressed={data === filter}
      setFilter={setFilter}
    />
  ));

  const preDragSublistRef = useRef<string[]>([]);
  const preDragOtherSublistRef = useRef<string[]>([]);
  const listHeadingRef = useRef<HTMLInputElement>(null);
  const prevTaskLength = usePrevious<number>(tasks.length);

  useEffect(() => {
    isAuthed();
    authed && refreshTasks();
  }, [authed, refreshTasks]);

  // Auto-sync every minute
  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(refreshTasks, 60_000);
    return () => clearInterval(interval);
  }, [authed, refreshTasks]);

  // Tick every 30s to keep relative time fresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
      localStorage.removeItem('offlineSince');
    };
    const handleOffline = () => {
      const now = new Date();
      setIsOnline(false);
      setOfflineSince(now);
      localStorage.setItem('offlineSince', now.toISOString());
    };
    const checkOnline = () => {
      if (navigator.onLine) handleOnline();
      else handleOffline();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', checkOnline);
    // Poll every 5s while offline to catch missed events
    const poll = setInterval(() => {
      if (!navigator.onLine !== !isOnline) checkOnline();
    }, 5_000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', checkOnline);
      clearInterval(poll);
    };
  }, [isOnline]);

  // Warn before unload while syncing
  useEffect(() => {
    if (syncStatus !== 'syncing') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [syncStatus]);

  // Replay pending ops when back online
  useEffect(() => {
    if (!isOnline || pendingOpsRef.current.length === 0) return;
    setSyncStatus('syncing');
    const ops = pendingOpsRef.current;
    (async () => {
      for (const op of ops) {
        try {
          await replayOp(op);
        } catch (e) {
          console.warn('Failed to replay op, skipping:', op, e);
        }
      }
      pendingOpsRef.current = [];
      localStorage.removeItem('pendingOps');
      setPendingCount(0);
      await refreshTasks();
      setSyncStatus('synced-flash');
      setTimeout(() => setSyncStatus('idle'), 3000);
    })().catch((e) => {
      errorToast(e);
      setSyncStatus('idle');
    });
  }, [isOnline, refreshTasks]); // eslint-disable-line react-hooks/exhaustive-deps
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
          setTasks((prev) => {
            const pinnedIds = new Set(pinnedTasks.map((t) => t.id));
            const unpinned = prev.filter((t) => !pinnedIds.has(t.id));
            return [...newOrder, ...unpinned];
          });
        }}
        onStart={() => {
          preDragSublistRef.current = pinnedTasks.map((t) => t.id);
          preDragOtherSublistRef.current = unpinnedTasks.map((t) => t.id);
        }}
        onEnd={(evt) => {
          if (evt.oldIndex !== evt.newIndex) {
            const movedId = preDragSublistRef.current[evt.oldIndex!];
            const newPinned = [...preDragSublistRef.current];
            newPinned.splice(evt.oldIndex!, 1);
            newPinned.splice(evt.newIndex!, 0, movedId);
            const orderedIds = [
              ...newPinned,
              ...preDragOtherSublistRef.current,
            ];
            dragTask(movedId, orderedIds.indexOf(movedId) + 1, orderedIds);
          }
        }}
        delay={500}
        delayOnTouchOnly={true}
        touchStartThreshold={5}
        filter="textarea"
        preventOnFilter={false}
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
          setTasks((prev) => {
            const unpinnedIds = new Set(unpinnedTasks.map((t) => t.id));
            const pinned = prev.filter((t) => !unpinnedIds.has(t.id));
            return [...pinned, ...newOrder];
          });
        }}
        onStart={() => {
          preDragSublistRef.current = unpinnedTasks.map((t) => t.id);
          preDragOtherSublistRef.current = pinnedTasks.map((t) => t.id);
        }}
        onEnd={(evt) => {
          if (evt.oldIndex !== evt.newIndex) {
            const movedId = preDragSublistRef.current[evt.oldIndex!];
            const newUnpinned = [...preDragSublistRef.current];
            newUnpinned.splice(evt.oldIndex!, 1);
            newUnpinned.splice(evt.newIndex!, 0, movedId);
            const orderedIds = [
              ...preDragOtherSublistRef.current,
              ...newUnpinned,
            ];
            dragTask(movedId, orderedIds.indexOf(movedId) + 1, orderedIds);
          }
        }}
        delay={500}
        delayOnTouchOnly={true}
        touchStartThreshold={5}
        filter="textarea"
        preventOnFilter={false}
        animation={150}
      >
        {unpinnedTasks.map(formSection)}
      </ScrollableSortable>
    </>
  );

  return (
    <>
      <header data-authed={authed}>
        <a href="#main" id="skip-main">
          Skip to main content
        </a>
        <h1>Tasks</h1>
        {authed && (
          <div className="header-right">
            {(() => {
              if (!isOnline)
                return (
                  <span className="sync-status offline">
                    {getOfflineLabel(offlineSince)}
                    {pendingCount > 0
                      ? ` — ${pendingCount} change${pendingCount !== 1 ? 's' : ''} saved locally`
                      : ''}
                  </span>
                );
              if (syncStatus === 'syncing')
                return <span className="sync-status syncing">Syncing</span>;
              if (syncStatus === 'synced-flash')
                return <span className="sync-status">Synced</span>;
              return null;
            })()}
            <div className="filters">{filterList}</div>
          </div>
        )}
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
