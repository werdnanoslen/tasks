import React, { useState } from "react";

function Form(props) {
  const [name, setName] = useState('');
  const inputLabel = 'Add a task';
  const addButtonLabel = 'Add';

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    props.addTask(name);
    setName("");
  }

  function handleChange(e) {
    const element = e.target;
    setName(element.value);
    element.style.height = "0";
    element.style.height = (element.scrollHeight)+"px";
    console.log(element.style.height)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="add-task" className="visually-hidden">
        {inputLabel}
      </label>
      <textarea
        className="input"
        name="text"
        autoComplete="off"
        value={name}
        onInput={handleChange}
        placeholder={inputLabel}
        rows="1"
      />
      <button type="submit" className="btn" id="add-button">
        {addButtonLabel}
      </button>
    </form>
  );
}

export default Form;
