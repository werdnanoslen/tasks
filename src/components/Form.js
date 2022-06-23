//https://www.robinwieruch.de/react-update-item-in-list/
import React, { useState, useRef, useEffect } from "react";
import { ReactComponent as Checkbox } from '../images/checkbox.svg'
import { nanoid } from "nanoid";

function NewChecklistItem() {
  return {
    id: "task-" + nanoid(),
    data: {},
    done: false
  }
};

function Form(props) {
  const [isEditing, setEditing] = useState(false);
  const [data, setData] = useState('');
  const [checklistData, setChecklistData] = useState([NewChecklistItem()]);
  const [checklist, setChecklist] = useState(false);
  const inputLabel = 'Add a task';
  const addButtonLabel = 'Add';
  const lastRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!data.trim()) {
      return;
    }
    props.addTask(data);
    setData("");
    setEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setEditing(false);
    }
  }

  function addChecklistItem(e) {
    if (e.key == 'Enter') {
      e.preventDefault();
      setChecklistData([...checklistData, NewChecklistItem()]);
    }
  }

  function handleChange(e) {
    const element = e.target;
    setData(element.value);
    element.style.height = "0";
    element.style.height = (element.scrollHeight)+"px";
  }

  function toggleChecklist() {
    setChecklist(prevChecklist => !prevChecklist);
  }

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
        <Checkbox aria-hidden="true"/>
        <span className="visually-hidden">Checklist mode</span>
      </button>
    </div>
  );

  const dataArea = (
    <textarea
      id="add-task"
      name="data"
      className="input"
      value={data}
      onInput={handleChange}
      onFocus={() => setEditing(true)}
      placeholder={inputLabel}
      rows="1"
    />
  );

  const checklistGroup = (
    <ul>
      {checklistData.map((item, i) => (
        <li key={i}>
          <input
            type='checkbox'
            aria-label='done'
          /> <textarea
            // id="add-task"
            name="data"
            className="input"
            // value={data}
            onInput={handleChange}
            onKeyPress={addChecklistItem}
            onFocus={() => setEditing(true)}
            placeholder={inputLabel}
            rows="1"
            ref={i === checklistData.length - 1 ? lastRef : undefined}
          />
        </li>
      ))}
    </ul>
  );

  useEffect(() => {
    if (lastRef.current)
      lastRef.current.focus();
  }, [checklistData]);

  return (
    <>
      <form onSubmit={handleSubmit} >
        <label htmlFor="add-task" className="visually-hidden">
          {inputLabel}
        </label>
        {checklist ? checklistGroup : dataArea}
        {isEditing ? editingTemplate : ''}
      </form>
    </>
  );
}

export default Form;
