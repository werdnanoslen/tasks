//https://www.robinwieruch.de/react-update-item-in-list/
import React, { useState, useRef, useEffect } from 'react';
import { ReactComponent as Checkbox } from '../images/checkbox.svg';
import { nanoid } from 'nanoid';
import TextareaAutosize from 'react-textarea-autosize';

function NewChecklistItem() {
  return {
    id: 'task-' + nanoid(),
    data: '',
    done: false,
  };
}

function Form(props) {
  const [isEditing, setEditing] = useState(false);
  const [data, setData] = useState('');
  const [checklistData, setChecklistData] = useState([NewChecklistItem()]);
  const [newItemId, setNewItemId] = useState('');
  const [checklist, setChecklist] = useState(false);
  const inputLabel = 'Add a task';
  const addButtonLabel = 'Add';
  const lastRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    checklist ? props.addTask(checklistData) : props.addTask(data);
    setData('');
    setChecklistData([NewChecklistItem()]);
    setEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setEditing(false);
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
  }

  function toggleChecklist() {
    setChecklist((prevChecklist) => !prevChecklist);
    if (checklist) {
      const n = String.fromCharCode(13, 10); //newline character
      setData(
        checklistData.reduce((p, c, i) => p.concat((i ? n : '') + c.data), '')
      );
    }
  }

  function dataArea(item?, index?) {
    return (
      <TextareaAutosize
        id={item ? item.id : 'add-task'}
        name="data"
        className="input"
        value={item ? item.data : data}
        onKeyDown={(e) => addChecklistItem(e, index)}
        onInput={(e) => handleInput(e, index)}
        onFocus={() => setEditing(true)}
        placeholder={inputLabel}
        rows="1"
        ref={item && item.id === newItemId ? lastRef : undefined}
      />
    );
  }

  const checklistGroup = (
    <ul>
      {checklistData.map((item, i) => (
        <li key={i}>
          <input type="checkbox" aria-label="done" />
          {dataArea(item, i)}
        </li>
      ))}
    </ul>
  );

  const editingTemplate = (
    <div className="btn-group">
      <button type="submit" className="btn" id="add-button">
        {addButtonLabel}
      </button>
      <button
        type="button"
        className="btn btn__icon"
        onClick={() => toggleChecklist()}
      >
        <Checkbox aria-hidden="true" />
        <span className="visually-hidden">Checklist mode</span>
      </button>
    </div>
  );

  useEffect(() => {
    if (lastRef.current) lastRef.current.focus();
  }, [checklistData]);

  return (
    <>
      <form onSubmit={handleSubmit} onBlur={blurCancel}>
        <label htmlFor="add-task" className="visually-hidden">
          {inputLabel}
        </label>
        {checklist ? checklistGroup : dataArea()}
        {isEditing ? editingTemplate : ''}
      </form>
    </>
  );
}

export default Form;
