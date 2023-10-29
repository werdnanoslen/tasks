import React, { useState, useRef, useEffect, SyntheticEvent, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ReactSortable } from 'react-sortablejs';
import { ListItem } from '../models/task';
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

  const iChecklistData: ListItem[] = iChecklist
    ? props.data
    : [NewChecklistItem()];
  const [checklistData, setChecklistData] = useState(iChecklistData);

  const [isEditing, setIsEditing] = useState(false);
  const [newItemId, setNewItemId] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const newTask: boolean = props.id === 'new-task';
  const inputLabel = newTask ? 'Type to add a task' : 'Edit task';
  const lastRef = useRef<HTMLTextAreaElement>(null);
  const delRef = useCallback(e => (e ? e.focus() : null), []);
  const completeLabel = props.done ? 'Restore' : 'Complete';
  const MAXLENGTH = 1000;

  function handleSubmit(e?: SyntheticEvent) {
    if (e) e.preventDefault();
    const newData = checklist ? checklistData : data;
    if (newTask) {
      props.addTask(newData);
      setData('');
      setChecklistData([NewChecklistItem()]);
    } else {
      props.updateData(props.id, newData);
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

  async function deleteListItem(id: number, e: React.MouseEvent) {
    const remainingItems = checklistData.filter((item) => id !== item.id);
    if (remainingItems.length === 0) {
      setChecklistData(iChecklistData);
      setChecklist(false);
      setData('');
    } else {
      setChecklistData(remainingItems);
    }
  }

  function toggleListItemDone(id: number) {
    let updatedItems = [...checklistData];
    for (let i = 0; i < checklistData.length; i++) {
      const item = checklistData[i];
      if (id === item.id) {
        updatedItems.splice(i, 1)[0];
        const nowDone = !item.done;
        const newItem = { ...item, done: nowDone };
        if (nowDone) {
          updatedItems.push(newItem);
          props.setNarrator('Checked item moved to bottom of list. Next item now under focus.')
        } else {
          updatedItems.unshift(newItem);
          props.setNarrator('Checked item moved to top of list. Next item now under focus.')
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
        maxLength={MAXLENGTH}
      />
    );
  }

  function checklistGroup() {
    return (
      <ReactSortable
        tag="ul"
        handle=".btn__drag"
        list={checklistData}
        setList={(newItems, _, { dragging }) => {
          dragging && setChecklistData(newItems);
        }}
      >
        {checklistData.map((item, i) => (
          <li key={i}>
            <div className="list-controls">
              <button className="btn btn__icon btn__drag">
                <span className="visually-hidden">Move list item</span>
                <span className="ascii-icon" aria-hidden="true">{String.fromCharCode(8661)}</span>
              </button>
              <input
                type="checkbox"
                checked={item.done}
                aria-label="done"
                onChange={() => toggleListItemDone(item.id)}
              />
            </div>
            {dataArea(item, i, item.done)}
            <button
              className="btn btn__icon btn__close"
              onClick={(e) => deleteListItem(item.id, e)}
            >
              <span className="ascii-icon" aria-hidden="true">{String.fromCharCode(10005)}</span>
              <span className="visually-hidden">Delete list item</span>
            </button>
          </li>
        ))}
      </ReactSortable>
    );
  }

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
        <img src={check} aria-hidden="true" alt="" />
        <span className="visually-hidden">
          {completeLabel}
        </span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => setConfirmDelete(true)}
      >
        <img src={rubbish} aria-hidden="true" alt="" />
        <span className="visually-hidden">Delete</span>
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => props.toggleTaskPinned(props.id)}
      >
        <img src={props.pinned ? pinned : unpinned} aria-hidden="true" alt="" />
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

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
    if (!newTask) handleSubmit();
  }, [checklistData]);

  return (
    <li
      id={props.id}
      className={`task ${props.hide ? 'hide' : ''} ${
        isMoving ? 'moving' : ''
      } ${props.pinned || newTask ? 'filtered' : ''}`}
      tabIndex={isMoving || !props.movement ? 0 : -1}
      draggable={newTask || props.pinned ? false : true}
      role="option"
      aria-label={`${checklist ? `checklist` : ``} task`}
      aria-describedby={newTask ? 'instructions' : undefined}
      onDragEnd={newTask ? undefined : handleSubmit}
      onKeyDown={(e) => moveTask(e)}
      onBlur={(e) => {
        if (isMoving) {
          setIsMoving(false);
          props.moveTask(props.id, 0, false);
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        onBlur={newTask ? handleBlur : handleSubmit}
        id={props.id}
        className={isEditing ? 'isEditing' : undefined}
      >
        {props.error && <div role="status">{props.error}</div>}
        {checklist ? checklistGroup() : dataArea()}
        <div className="btn-group">
          {newTask
            ? addingTools
            : confirmDelete
            ? confirmDeleteButtons
            : editingTools}
          {!confirmDelete && (
            <button
              type="button"
              className="btn btn__icon"
              onClick={() => toggleChecklist()}
              aria-pressed={checklist ? true : false}
              aria-label="Checklist mode"
              id="instructions"
            >
              <img src={checkbox} aria-hidden="true" alt="" />
            </button>
          )}
        </div>
      </form>
    </li>
  );
}

export default Form;
