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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import usePrevious from '../hooks';
import { ListItem } from '../tasks/task.model';
import checkbox from '../images/checkbox.svg';
import check from '../images/check.svg';
import rubbish from '../images/rubbish.svg';
import pinned from '../images/pinned.svg';
import unpinned from '../images/unpinned.svg';
import imageIcon from '../images/image.svg';

function NewChecklistItem(data?): ListItem {
  return {
    id: crypto.randomUUID(),
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTask: boolean = props.id === 'new-task';
  const inputLabel = newTask ? 'Type to add a task' : 'Edit task';
  const lastRef = useRef<HTMLTextAreaElement>(null);
  const delRef = useCallback((e) => (e ? e.focus() : null), []);
  const completeLabel = props.done ? 'Restore' : 'Complete';
  const MAXLENGTH = 1000;

  const prevChecklistData = usePrevious(checklistData);
  const prevData = usePrevious(data);

  function handleSubmit(e?: SyntheticEvent) {
    if (e) e.preventDefault();
    const prevStuff = checklist ? prevChecklistData : prevData;
    const newStuff = checklist ? checklistData : data;
    if (newTask) {
      props.addTask(newStuff, imagePreview);
      setData('');
      setChecklistData([NewChecklistItem()]);
      setImagePreview(undefined);
      setImage(undefined);
    } else if (prevStuff !== newStuff) {
      props.updateData(props.id, newStuff, imagePreview);
    }
    setIsEditing(false);
  }

  function handleBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // TODO if no change, return
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

  async function deleteListItem(id: string) {
    await props.deleteListItem(props.id, id);
  }

  function toggleListItemDone(id: string) {
    let updatedItems = [...checklistData];
    for (let i = 0; i < checklistData.length; i++) {
      const item = checklistData[i];
      if (id === item.id) {
        updatedItems.splice(i, 1);
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

  const ChecklistItem = (item: ListItem, index: number) => {
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
        {dataArea(item, index, item.done)}
        <button
          className="btn btn__icon btn__close"
          onClick={() => deleteListItem(item.id)}
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
          {checklistData.map((item, i) => ChecklistItem(item, i))}
        </SortableContext>
      </DndContext>
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newImage = e.target.files ? e.target.files[0] : undefined;
    setImagePreview(newImage);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    if (newImage) reader.readAsDataURL(newImage);
    if (!newTask) props.updateData(props.id, null, newImage);
  }

  const previewImage = () => {
    return (
      <img
        src={image}
        alt="Upload"
        aria-describedby={`edit-${props.id}`}
        className="task-image"
      />
    );
  };

  const editingTools = (
    <>
      <button type="submit" className="btn visually-hidden">
        Save
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskDone(props.id, props.done)}
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
        onClick={() => props.toggleTaskPinned(props.id, props.pinned)}
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
    if (checklistData.length === 0) {
      setChecklist(false);
      setData('');
    }
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
        }
      )}
      aria-label={`${checklist ? `checklist` : ``} task`}
      onDragEnd={newTask ? undefined : handleSubmit}
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
