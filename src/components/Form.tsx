import React, { useState, useRef, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ReactSortable } from 'react-sortablejs';
import { Task, ListItem } from '../models/task';
import checkbox from '../images/checkbox.svg';
import check from '../images/check.svg';
import rubbish from '../images/rubbish.svg';
import pinned from '../images/pinned.svg';
import unpinned from '../images/unpinned.svg';

function NewChecklistItem(data?): ListItem {
  return {
    id: Date.now(),
    data: data ? data : '',
    done: false,
  };
}

function Form(props) {
  const iChecklist: boolean = props.data && typeof props.data !== 'string';
  const [checklist, setChecklist] = useState(iChecklist);

  const [data, setData] = useState(iChecklist ? '' : props.data);

  const iChecklistData: ListItem[] = iChecklist ? props.data : [NewChecklistItem()];
  const [checklistData, setChecklistData] = useState(iChecklistData);

  const [isEditing, setIsEditing] = useState(false);
  const [newItemId, setNewItemId] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTask: boolean = props.id === 'new-task';
  const inputLabel = newTask ? 'Add task' : 'Edit task';
  const lastRef = useRef<HTMLTextAreaElement>(null);
  const completeLabel = props.done ? 'Restore' : 'Complete';

  function handleSubmit(e?) {
    if (e) e.preventDefault();
    const newData = checklist ? checklistData : data;
    if (newTask) {
      props.addTask(newData);
      setData('');
      setChecklistData([NewChecklistItem()]);
    } else {
      props.updateTask(props.id, newData);
    }
    setIsEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      checklist ? setChecklistData(iChecklistData) : setData(props.data);
      setChecklist(iChecklist);
      setIsEditing(false);
    }
  }

  function addChecklistItem(e, i) {
    if (checklist && e.key === 'Enter') {
      e.preventDefault();
      const newList = checklistData.slice();
      const newItem = NewChecklistItem();
      setNewItemId(newItem.id);
      newList.splice(i + 1, 0, newItem);
      setChecklistData(newList);
      if (!newTask) handleSubmit();
    }
  }

  function deleteListItem(id) {
    const remainingItems = checklistData.filter((item) => id !== item.id);
    setChecklistData(remainingItems);
    if (remainingItems.length === 0) {
      setChecklistData(iChecklistData);
      setChecklist(false);
      setData('');
    }
    if (!newTask) handleSubmit();
  }

  function toggleListItemDone(id) {
    let updatedItems = [...checklistData];
    for (let i = 0; i < checklistData.length; i++) {
      const item = checklistData[i];
      if (id === item.id) {
        updatedItems.splice(i, 1)[0];
        const nowDone = !item.done
        const newItem = { ...item, done: nowDone }
        if (nowDone) {
          updatedItems.push(newItem);
        } else {
          updatedItems.unshift(newItem);
        }
        setChecklistData(updatedItems);
        if (!newTask) handleSubmit();
        break;
      }
    }
  }

  function handleInput(e, i) {
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
    let newData
    if (checklist) {
      const listify = (p, c, i) => p.concat((i ? n : '') + c.data);
      newData = checklistData.reduce(listify, '');
      setData(newData);
    } else {
      if (data && data.length > 0) {
        newData = data.split(n).map((line) => NewChecklistItem(line));
      } else {
        newData = [NewChecklistItem()]
      }
      setChecklistData(newData)
    }
    !newTask && props.updateTask(props.id, newData);
  }

  function moveTask(e) {
    if (newTask) return;
    switch (e.key) {
      case ' ':
      case 'Enter':
        setIsMoving((prevIsMoving) => !prevIsMoving);
        props.moveTask(props.id, 0, !isMoving);
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

  function dataArea(item?, index?, done?) {
    return (
      <TextareaAutosize
        id={`edit-${props.id}`}
        name="data"
        className={`input ${done ? 'done' : ''}`}
        value={item ? item.data : data}
        onKeyDown={(e) => addChecklistItem(e, index)}
        onInput={(e) => handleInput(e, index)}
        onFocus={() => setIsEditing(true)}
        placeholder={inputLabel}
        aria-label={inputLabel}
        rows={1}
        ref={item && item.id === newItemId ? lastRef : undefined}
        maxLength={500}
      />
    );
  }

  function checklistGroup() {
    return (
      <ReactSortable tag="ul" list={checklistData} setList={(newItems, _, {dragging}) => {dragging && setChecklistData(newItems)}}>
        {checklistData.map((item, i) => (
          <li key={i}>
            <div className="list-controls">
              <button className="btn btn__icon btn__drag">
                <span className="visually-hidden">Move list item</span>
                <span aria-hidden="true">{String.fromCharCode(8661)}</span>
              </button>
              <input type="checkbox" checked={item.done} aria-label="done" onChange={() => toggleListItemDone(item.id)} />
            </div>
            {dataArea(item, i, item.done)}
            <button
              className="btn btn__icon btn__close"
              onClick={() => deleteListItem(item.id)}
            >
              <span className="visually-hidden">Delete list item</span>
              <span aria-hidden="true">{String.fromCharCode(10005)}</span>
            </button>
          </li>
        ))}
      </ReactSortable>
    );
  }

  const editingTools = (
    <>
      <button type="submit" className="btn visually-hidden">
        Save {props.id}
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskDone(props.id)}
      >
        <img src={check} aria-hidden="true" />
        <span className="visually-hidden">
          {completeLabel} {props.id}
        </span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => setConfirmDelete(true)}
      >
        <img src={rubbish} aria-hidden="true" />
        <span className="visually-hidden">Delete {props.id}</span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskPinned(props.id)}
      >
        <img src={props.pinned ? pinned : unpinned} aria-hidden="true" />
        <span className="visually-hidden">{props.pinned && 'Un-'}Pin task</span>
      </button>
    </>
  );

  const confirmDeleteButtons = (
    <>
      <button type="button" className="btn" onClick={() => props.deleteTask(props.id) && setConfirmDelete(false)}>
        Confirm delete
      </button>
      <button type="submit" className="btn" onClick={() => setConfirmDelete(false)}>
        Cancel
      </button>
    </>
  );

  const addingTools = (
    <button type="submit" className="btn" id="add-button">
      Add
    </button>
  );

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
  }, [checklistData]);

  return (
    <li
      className={`task ${props.hide ? 'hide' : ''} ${isMoving ? 'moving' : ''}`}
      tabIndex={isMoving ? 0 : props.movement ? -1 : 0}
      draggable="true"
      role="option"
      aria-describedby={newTask ? 'instructions' : ''}
      onDragEnd={newTask ? undefined : handleSubmit}
      onKeyDown={(e) => moveTask(e)}
      onBlur={(e) => {
        if (isMoving) {
          setIsMoving(false);
          props.moveTask(props.id, 0, false);
        }
      }}
    >
      <form onSubmit={handleSubmit} onBlur={newTask ? blurCancel : handleSubmit} id={props.id} className={isEditing ? 'isEditing' : undefined}>
        {checklist ? checklistGroup() : dataArea()}
        <div className="btn-group">
          {newTask ? addingTools : confirmDelete ? confirmDeleteButtons : editingTools}
          {!confirmDelete && 
            <button
              type="button"
              className="btn btn__icon"
              onClick={() => toggleChecklist()}
            >
              <img src={checkbox} aria-hidden="true" />
              <span className="visually-hidden">Checklist mode</span>
            </button>
          }
        </div>
      </form>
    </li>
  );
}

export default Form;
