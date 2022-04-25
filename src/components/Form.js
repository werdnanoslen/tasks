import React, { useState } from "react";

function Form(props) {
  const [isEditing, setEditing] = useState(false);
  const [text, setText] = useState('');
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

  const editingTemplate = (
    <div className="btn-group">
      <button type="submit" className="btn" id="add-button">
        {addButtonLabel}
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} onBlur={blurCancel}>
      <label htmlFor="add-task" className="visually-hidden">
        {inputLabel}
      </label>
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
      {isEditing ? editingTemplate : ''}
    </form>
  );
}

export default Form;
