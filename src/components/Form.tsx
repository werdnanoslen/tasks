import React, {
  useState,
  useRef,
  useEffect,
  SyntheticEvent,
  useCallback,
} from 'react';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListItem } from '../tasks/task.model';
import checkbox from '../images/checkbox.svg';
import check from '../images/check.svg';
import rubbish from '../images/rubbish.svg';
import pinned from '../images/pinned.svg';
import unpinned from '../images/unpinned.svg';
import noimageIcon from '../images/noimage.svg';
import imageIcon from '../images/image.svg';

function NewChecklistItem(data?): ListItem {
  return {
    id: self.crypto.randomUUID(),
    data: data ? data : '',
    done: false,
  };
}

function Form(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const iChecklist: boolean = props.data && typeof props.data !== 'string';
  const [checklist, setChecklist] = useState(iChecklist);

  const [data, setData] = useState(iChecklist ? '' : props.data);
  const [imagePreview, setImagePreview] = useState<File | undefined>();
  const [image, setImage] = useState<string | undefined>(props.image);
  const iChecklistData: ListItem[] = iChecklist
    ? props.data
    : [NewChecklistItem()];
  const [checklistData, setChecklistData] = useState(iChecklistData);

  const [isEditing, setIsEditing] = useState(false);
  const [newItemId, setNewItemId] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTask: boolean = props.id === 'new-task';
  const inputLabel = newTask ? 'Type to add a task' : 'Edit task';
  const lastRef = useRef<HTMLTextAreaElement>(null);
  const delRef = useCallback((e) => (e ? e.focus() : null), []);
  const completeLabel = props.done ? 'Restore' : 'Complete';
  const MAXLENGTH = 1000;

  function handleSubmit(e?: SyntheticEvent) {
    if (e) e.preventDefault();
    const newData = checklist ? checklistData : data;
    if (newTask) {
      props.addTask(newData, imagePreview);
      setData('');
      setChecklistData([NewChecklistItem()]);
      setImagePreview(undefined);
      setImage(undefined);
    } else {
      props.updateData(props.id, newData, imagePreview);
    }
    setIsEditing(false);
  }

  function handleBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      checklist ? setChecklistData(iChecklistData) : setData(props.data);
      setChecklist(iChecklist);
      setIsEditing(false);
    }
  }

  function addChecklistItem(e: React.KeyboardEvent, i: number) {
    if (checklist && e.key === 'Enter') {
      e.preventDefault();
      const newList = checklistData.slice();
      const newItem = NewChecklistItem();
      setNewItemId(newItem.id);
      newList.splice(i + 1, 0, newItem);
      setChecklistData(newList);
    }
  }

  async function deleteListItem(id: string, e: React.MouseEvent) {
    const remainingItems = checklistData.filter((item) => id !== item.id);
    if (remainingItems.length === 0) {
      setChecklistData(iChecklistData);
      setChecklist(false);
      setData('');
    } else {
      setChecklistData(remainingItems);
    }
  }

  function toggleListItemDone(id: string) {
    let updatedItems = [...checklistData];
    for (let i = 0; i < checklistData.length; i++) {
      const item = checklistData[i];
      if (id === item.id) {
        updatedItems.splice(i, 1)[0];
        const nowDone = !item.done;
        const newItem = { ...item, done: nowDone };
        if (nowDone) {
          updatedItems.push(newItem);
          props.setNarrator(
            'Checked item moved to bottom of list. Next item now under focus.'
          );
        } else {
          updatedItems.unshift(newItem);
          props.setNarrator(
            'Checked item moved to top of list. Next item now under focus.'
          );
        }
        setChecklistData(updatedItems);
        break;
      }
    }
  }

  function handleInput(e, i: number) {
    const input = e.target.value;
    if (checklist) {
      let checklistDataCopy = [...checklistData];
      checklistDataCopy[i] = { ...checklistDataCopy[i], data: input };
      setChecklistData(checklistDataCopy);
    } else {
      setData(input);
    }
    if (!newTask) handleSubmit();
  }

  function toggleChecklist() {
    setChecklist((prevChecklist) => !prevChecklist);
    const n = String.fromCharCode(10); //newline character
    let newData;
    if (checklist) {
      const listify = (p, c, i) => p.concat((i ? n : '') + c.data);
      newData = checklistData.reduce(listify, '');
      setData(newData);
    } else {
      if (data && data.length > 0) {
        const splitData = data.split(n);
        if (splitData.length > MAXLENGTH - 1) {
          newData = splitData.splice(0, MAXLENGTH - 1);
          newData.push(splitData.join(n));
        } else {
          newData = splitData;
        }
        newData = newData.map((line) => NewChecklistItem(line));
      } else {
        newData = [NewChecklistItem()];
      }
      setChecklistData(newData);
    }
    !newTask && props.updateData(props.id, newData);
  }

  function moveTask(e) {
    if (newTask) return;
    switch (e.key) {
      case ' ':
      case 'Enter':
        if (document.activeElement?.classList.contains('task')) {
          setIsMoving((prevIsMoving) => !prevIsMoving);
          props.moveTask(props.id, 0, !isMoving);
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        if (isMoving) props.moveTask(props.id, 1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (isMoving) props.moveTask(props.id, -1);
        break;
    }
  }

  // TODO if just url, show preview and turn into link
  function dataArea(item?, index?, done?) {
    return (
      <TextareaAutosize
        id={`edit-${item ? item.id : index}`}
        name="data"
        className={classNames('input', { done: done })}
        value={item ? item.data : data}
        onKeyDown={(e) => addChecklistItem(e, index)}
        onInput={(e) => handleInput(e, index)}
        onFocus={() => setIsEditing(true)}
        placeholder={inputLabel}
        aria-label={inputLabel}
        rows={1}
        ref={item && item.id === newItemId ? lastRef : undefined}
        maxLength={MAXLENGTH}
      />
    );
  }

  function dragChecklistItem(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setChecklistData((items) => {
        const oldIndex = items.findIndex(({ id }) => id === active.id);
        const newIndex = items.findIndex(({ id }) => id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const ChecklistItem = (props: { children: ListItem }) => {
    const item = props.children;
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
    } = useSortable({
      id: item.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      //TODO controls aren't working!
      <li key={item.id} ref={setNodeRef} style={style}>
        <div className="list-controls">
          <button
            className="btn btn__icon btn__drag"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
          >
            <span className="visually-hidden">Move list item</span>
            <span className="ascii-icon" aria-hidden="true">
              {String.fromCharCode(8661)}
            </span>
          </button>
          <input
            type="checkbox"
            checked={item.done}
            aria-label="done"
            onChange={() => toggleListItemDone(item.id)}
          />
        </div>
        {dataArea(item, item.id, item.done)}
        <button
          className="btn btn__icon btn__close"
          onClick={(e) => deleteListItem(item.id, e)}
        >
          <span className="ascii-icon" aria-hidden="true">
            {String.fromCharCode(10005)}
          </span>
          <span className="visually-hidden">Delete list item</span>
        </button>
      </li>
    );
  };

  function checklistGroup() {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={dragChecklistItem}
      >
        <SortableContext
          items={checklistData.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {checklistData.map((item) => (
            <ChecklistItem key={item.id}>{item}</ChecklistItem>
          ))}
        </SortableContext>
      </DndContext>
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newImage = e.target.files ? e.target.files[0] : undefined;
    if (!newTask) {
      props.updateData(props.id, null, newImage);
    } else {
      setImagePreview(newImage);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      if (newImage) reader.readAsDataURL(newImage);
    }
  }

  const previewImage = () => {
    const src = image ?? noimageIcon;
    const alt =
      image || imagePreview ? 'TODO' : 'This image cannot be displayed';
    return <img src={src} alt={alt} className="task-image" />; //TODO not showing up until after reload on updateTask
  };

  const editingTools = (
    <>
      <button type="submit" className="btn visually-hidden">
        Save
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskDone(props.id)}
      >
        <img src={check} alt="" />
        <span className="visually-hidden">{completeLabel}</span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => setConfirmDelete(true)}
      >
        <img src={rubbish} alt="" />
        <span className="visually-hidden">Delete</span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskPinned(props.id)}
      >
        <img src={props.pinned ? pinned : unpinned} alt="" />
        <span className="visually-hidden">{props.pinned ? 'Un-' : ''}Pin</span>
      </button>
    </>
  );

  const confirmDeleteButtons = (
    <>
      <button
        type="button"
        className="btn"
        ref={delRef}
        onClick={() => props.deleteTask(props.id) && setConfirmDelete(false)}
      >
        Confirm delete
      </button>
      <button
        type="submit"
        className="btn"
        onClick={() => setConfirmDelete(false)}
      >
        Cancel
      </button>
    </>
  );

  const addingTools = (
    <button type="submit" className="btn" id="add-button">
      Add
    </button>
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
    if (!newTask) handleSubmit();
  }, [checklistData]);

  return (
    <li
      id={props.id}
      className={classNames(
        'task',
        CSS.Transform.toString(transform),
        transition,
        {
          hide: props.hide,
          moving: isMoving,
        }
      )}
      aria-label={`${checklist ? `checklist` : ``} task`}
      onDragEnd={newTask ? undefined : handleSubmit}
      onKeyDown={(e) => moveTask(e)}
      onBlur={(e) => {
        if (isMoving) {
          setIsMoving(false);
          props.moveTask(props.id, 0, false);
        }
      }}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <form
        onSubmit={handleSubmit}
        onBlur={newTask ? handleBlur : handleSubmit}
        id={props.id}
        className={classNames({ isEditing: isEditing })}
        encType="multipart/form-data"
      >
        {props.error && <div role="status">{props.error}</div>}
        {(image || imagePreview) && previewImage()}
        {checklist ? checklistGroup() : dataArea()}
        <div className="btn-group">
          {newTask
            ? addingTools
            : confirmDelete
              ? confirmDeleteButtons
              : editingTools}
          {!confirmDelete && (
            <>
              <button
                type="button"
                className="btn btn__icon"
                onClick={() => toggleChecklist()}
                aria-pressed={checklist ? true : false}
                aria-label="Checklist mode"
              >
                <img src={checkbox} alt="" />
              </button>
              <button
                type="button"
                className="btn btn__icon"
                aria-label="Add image"
              >
                <label htmlFor={`add-image-${props.id}`}>
                  <img src={imageIcon} alt="" className="add-image-icon" />
                </label>
                <input
                  id={`add-image-${props.id}`}
                  className="add-image"
                  type="file"
                  accept="image/*"
                  name="upload"
                  onChange={handleImageChange}
                />
              </button>
            </>
          )}
        </div>
      </form>
    </li>
  );
}

export default Form;
