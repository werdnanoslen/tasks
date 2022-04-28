import React, { useState } from "react";
import { ReactComponent as Checkbox } from '../images/checkbox.svg'

function Form(props) {
  const [isEditing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [checklist, setChecklist] = useState(false);
  const inputLabel = 'Add a task';
  const addButtonLabel = 'Add';

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }
    props.addTask(text);
    setText("");
    setEditing(false);
  }

  function blurCancel(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setEditing(false);
    }
  }

  function handleChange(e) {
    const element = e.target;
    setText(element.value);
    element.style.height = "0";
    element.style.height = (element.scrollHeight)+"px";
  }

  function toggleChecklist() {
    setChecklist(!checklist);
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

  const textArea = (
    <textarea
      id="add-task"
      name="text"
      className="input"
      value={text}
      onInput={handleChange}
      onFocus={() => setEditing(true)}
      placeholder={inputLabel}
      rows="1"
    />
  );

  const checklistGroup = (
    <ul>
      <li><input type='checkbox' aria-label='done'/>{textArea}</li>
    </ul>
  );
  console.log(checklistGroup)
  return (
    <>
      <form onSubmit={handleSubmit} >
        <label htmlFor="add-task" className="visually-hidden">
          {inputLabel}
        </label>
        {checklist ? checklistGroup : textArea}
        {isEditing ? editingTemplate : ''}
      </form>
    </>
  );
}

export default Form;
