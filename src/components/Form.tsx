import React, { useState, useEffect, SyntheticEvent, useCallback } from 'react';
import classNames from 'classnames';
import * as API from '../api';
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
import ChecklistItem from './ChecklistItem';
import DataArea from './DataArea';
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

type FormProps = {
  id: string;
  data?: any;
  image?: string;
  done?: boolean;
  pinned?: boolean;
  hide?: boolean;
  error?: string;
  newItemId?: string;
  setNarrator: (msg: string) => void;
  addTask?: (data: any, image?: File) => void;
  updateData?: (id: string, data: any, image?: File) => void;
  deleteTask?: (id: string) => void;
  toggleTaskDone?: (id: string, done: boolean) => void;
  toggleTaskPinned?: (id: string, pinned: boolean) => void;
  setNewItemId?: (id: string) => void;
  deleteListItem?: (taskId: string, itemId: string) => Promise<void>;
};

const Form = React.memo(function Form(props: FormProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });
  const sensors = useSensors(
    useSensor(PointerSensor),
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTask: boolean = props.id === 'new-task';
  const delRef = useCallback((e) => (e ? e.focus() : null), []);
  const completeLabel = props.done ? 'Restore' : 'Complete';
  const MAXLENGTH = 1000;

  const prevChecklistData = usePrevious<ListItem[]>(checklistData);
  const prevData = usePrevious<any>(data);

  // Extract URLs from checklist data for link previews
  const [linkMetadataList, setLinkMetadataList] = useState<{ title: string; favicon: string; url: string }[]>([]);
  
  useEffect(() => {
    if (checklist && !newTask) {
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const allText = checklistData.map(item => item.data).join(' ');
      const urls = allText.match(urlRegex) || [];
      
      if (urls.length > 0) {
        Promise.all(
          urls.map(url => API.getLinkMetadata(url).catch(() => null))
        ).then(results => {
          const validResults = results.filter(r => r !== null) as { title: string; favicon: string; url: string }[];
          setLinkMetadataList(validResults);
        });
      } else {
        setLinkMetadataList([]);
      }
    } else {
      setLinkMetadataList([]);
    }
  }, [checklist, checklistData, newTask]);

  function handleSubmit(e?: SyntheticEvent) {
    if (e) e.preventDefault();
    const prevStuff = checklist ? prevChecklistData : prevData;
    const newStuff = checklist ? checklistData : data;
    if (newTask) {
      if (props.addTask) {
        props.addTask(newStuff, imagePreview);
      }
      setData('');
      setChecklistData([NewChecklistItem()]);
      setImagePreview(undefined);
      setImage(undefined);
    } else if (prevStuff !== newStuff) {
      if (props.updateData) {
        props.updateData(props.id, newStuff, imagePreview);
      }
    }
    setIsEditing(false);
  }

  function handleBlur(e: React.FocusEvent) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // Preserve input on blur for new task; just exit editing mode
      setIsEditing(false);
    }
  }

  function updateChecklistItem(e: React.KeyboardEvent, i: number) {
    if (checklist) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newList = checklistData.slice();
        const newItem = NewChecklistItem();
        if (props.setNewItemId) {
          props.setNewItemId(newItem.id);
        }
        newList.splice(i + 1, 0, newItem);
        setChecklistData(newList);
      } else if (e.key === 'Backspace') {
        const item = checklistData[i];
        if (item.data.length === 0) {
          e.preventDefault();
          const newList = checklistData.slice();
          newList.splice(i, 1);
          setChecklistData(newList);
        }
      }
    }
  }

  async function deleteListItem(id: string) {
    if (newTask) {
      setChecklistData((prev) => prev.filter((item) => item.id !== id));
    } else if (props.deleteListItem) {
      await props.deleteListItem(props.id, id);
    }
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

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>, i?: number) {
    const input = (e.target as HTMLTextAreaElement).value;
    if (i !== undefined) {
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
    if (!newTask && props.updateData) {
      props.updateData(props.id, newData);
    }
  }

  function dragChecklistItem(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setChecklistData((items) => {
        const oldIndex = items.findIndex(({ id }) => id === active.id);
        const newIndex = items.findIndex(({ id }) => id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Persist new order immediately
        if (!newTask && props.updateData) props.updateData(props.id, newItems);
        return newItems;
      });
    }
  }

  function checklistGroup() {
    return (
      <>
        {linkMetadataList.map((linkMetadata, index) => (
          <a 
            key={linkMetadata.url + index}
            href={linkMetadata.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-button"
            title={linkMetadata.title}
          >
            {linkMetadata.favicon && (
              <img src={linkMetadata.favicon} alt="" className="link-favicon" onError={(e) => e.currentTarget.style.display = 'none'} />
            )}
            <span className="link-title">{linkMetadata.title}</span>
          </a>
        ))}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={dragChecklistItem}
        >
          <SortableContext
            items={checklistData.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {checklistData.map((item, i) => (
              <ChecklistItem
                item={item}
                deleteListItem={deleteListItem}
                toggleListItemDone={toggleListItemDone}
                key={item.id}
              >
                <DataArea
                  updateChecklistItem={updateChecklistItem}
                  handleInput={handleInput}
                  setIsEditing={setIsEditing}
                  id={item.id}
                  index={i}
                  done={item.done}
                  data={item.data}
                  newTask={newTask}
                  focusThis={props.newItemId === item.id}
                  showLinkPreview={false}
                />
              </ChecklistItem>
            ))}
          </SortableContext>
        </DndContext>
      </>
    );
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newImage = e.target.files ? e.target.files[0] : undefined;
    setImagePreview(newImage);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    if (newImage) reader.readAsDataURL(newImage);
    if (!newTask && props.updateData) props.updateData(props.id, null, newImage);
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
        className="btn visually-hidden"
        {...listeners}
      >
        Move
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => {
          if (props.toggleTaskDone && props.done) {
            props.toggleTaskDone(props.id, props.done)
          }
        }}
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
        onClick={(e) => {
          if (props.toggleTaskPinned) {
            props.toggleTaskPinned(props.id, props.pinned ?? false);
          }
          (e.currentTarget as HTMLButtonElement).focus();
        }}
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
        onClick={() => {
          if (props.deleteTask) {
            props.deleteTask(props.id);
          }
          setConfirmDelete(false);
        }}
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
        id={`form-${props.id}`}
        className={classNames({ isEditing: isEditing })}
        encType="multipart/form-data"
      >
        {props.error && <div role="status">{props.error}</div>}
        {(image || imagePreview) && previewImage()}
        {checklist ? (
          checklistGroup()
        ) : (
          <DataArea
            handleInput={handleInput}
            setIsEditing={setIsEditing}
            id={props.id}
            done={props.done}
            data={data}
            newTask={newTask}
          />
        )}
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
})

export default Form;
